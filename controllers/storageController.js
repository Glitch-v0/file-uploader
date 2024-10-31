import { folderQueries, fileQueries, tagQueries } from "../queries/queries.js";
import { cleanTags } from "../lib/cleanTags.js";
import { supabase } from "../app.js";

export const storageController = {
  getRootDirectoryData: async (req, res) => {
    const currentFolders = await folderQueries.getOrphanFolders();
    const currentFiles = await fileQueries.getOrphanFiles();

    res.render("cloud", {
      errors: null,
      files: currentFiles,
      folders: currentFolders,
      currentFolder: null,
      currentFolderTags: null,
      currentURL: "/cloud",
    });
  },

  getFolderData: async (req, res) => {
    const folderParameter = req.params.folderId;
    if (folderParameter == undefined) return res.redirect("/cloud");
    const parentFolder = await folderQueries.getFolderAndTags(folderParameter);
    const parentFolderTags = parentFolder.tags;
    if (!parentFolder) {
      return res.redirect("/cloud");
    }

    const childFolders = await folderQueries.getFolderChildren(parentFolder.id);
    const childFiles = await fileQueries.getFilesByFolder(parentFolder.id);

    res.render("cloud", {
      errors: null,
      files: childFiles,
      folders: childFolders,
      currentFolder: parentFolder,
      currentFolderTags: parentFolderTags,
      currentURL: req.originalUrl,
    });
  },

  createFolder: async (req, res, next) => {
    const currentParentFolder = req.params.folderId;
    const tags = cleanTags(req.body.tags);

    const newFolder = await folderQueries.createFolderWithRelations(
      req.body.name,
      req.user.id,
      currentParentFolder,
      tags,
    );

    res.redirect(`/cloud/${newFolder.id}`);
  },

  createTag: async (req, res, next) => {
    const newTag = await tagQueries.createTag(req.body.newTagName, req.user.id);
    res.redirect(`/tag/${newTag.id}`);
  },

  getFolderUpdateForm: async (req, res, next) => {
    const folder = await folderQueries.getFolder(req.params.folderId);
    res.render("updateItemName", {
      errors: null,
      item: folder,
      type: "folder",
      submissionURL: req.originalUrl,
    });
  },

  getFileUpdateForm: async (req, res, next) => {
    const file = await fileQueries.getFileById(req.params.fileId);
    res.render("updateItemName", {
      errors: null,
      item: file,
      type: "file",
      submissionURL: req.originalUrl,
    });
  },

  getTagUpdateForm: async (req, res, next) => {
    const tag = await tagQueries.getTag(parseInt(req.params.tagId));
    res.render("updateItemName", {
      errors: null,
      item: tag,
      type: "tag",
      submissionURL: req.originalUrl,
    });
  },

  updateFolder: async (req, res, next) => {
    const folder = await folderQueries.updateFolderName(
      req.params.folderId,
      req.body.name,
    );
    if (folder.parentFolderId) {
      res.redirect(`/cloud/${folder.parentFolderId}`);
    }
    res.redirect(`/cloud/${folder.id}`);
  },

  updateFile: async (req, res, next) => {
    const file = await fileQueries.getFileById(req.params.fileId);
    const fileExtension = file.name.split(".").pop();
    const newFileName = `${req.body.name}.${fileExtension}`;

    // Check if file name has indeed changed
    if (file.name === newFileName) {
      return res.render("updateItemName", {
        errors: [{ msg: "Same name entered. File not renamed." }],
        item: file,
        type: "file",
        submissionURL: req.originalUrl,
      });
    }

    // Supabase File update
    const currentURL = file.url;
    const newURL = currentURL.replace(file.name, newFileName);
    const { data, error } = await supabase.storage
      .from("files")
      .move(file.url, newURL);

    if (error) {
      throw new Error("Failed to rename file");
    }

    // Prisma File update
    const renamedFile = await fileQueries.updateFile(
      req.params.fileId,
      newFileName,
      newURL,
    );
    if (renamedFile.folderId) {
      res.redirect(`/cloud/${renamedFile.folderId}`);
    }
    res.redirect(`/cloud`);
  },

  updateTag: async (req, res, next) => {
    const tag = await tagQueries.updateTagName(
      parseInt(req.params.tagId),
      req.body.name,
    );
    res.redirect(`/tag/${tag.id}`);
  },

  deleteFolder: async (req, res, next) => {
    // Recursively get all child folders and files
    const folderIds = await folderQueries.getAllFolderIds(req.params.folderId);
    const fileURLs = await fileQueries.getFileUrlsByFolders(folderIds);

    // Supabase Folder deletion
    const supabaseSuccess = await supabase.storage
      .from("files")
      .remove(fileURLs);

    if (!supabaseSuccess) {
      throw new Error("Failed to delete folder from supabase");
    }

    // Prisma Folder deletion
    const dbSuccess = await folderQueries.deleteFolders(folderIds);
    if (!dbSuccess) {
      throw new Error("Failed to delete folder with prisma");
    }

    res.redirect("/cloud");
  },

  deleteFile: async (req, res, next) => {
    const file = await fileQueries.getFileById(req.params.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Supabase File deletion
    const supabaseSuccess = await supabase.storage
      .from("files")
      .remove(file.url);
    if (!supabaseSuccess) {
      throw new Error("Failed to delete file");
    }

    // Prisma File deletion
    const success = await fileQueries.deleteFile(file.id);
    if (!success) {
      throw new Error("Failed to delete file");
    }
    res.redirect("/cloud");
  },

  deleteTag: async (req, res, next) => {
    await tagQueries.deleteTag(parseInt(req.params.tagId));
    res.redirect("/cloud");
  },

  uploadFile: async (req, res, next) => {
    // List existing buckets
    const { data: bucketList, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      throw new Error("Error listing buckets:", listError.message);
    } else {
      // Create a new bucket if none exist
      if (bucketList.length === 0) {
        const { data: newBucket, error: createError } =
          await supabase.storage.createBucket("files");

        if (createError) {
          throw new Error("Error creating bucket:", createError.message);
        }
      }
    }

    // Generate supabase url with optional parent folder
    const uploadPath = req.params.folderId
      ? `${req.user.id}/${req.params.folderId}/${req.file.originalname}`
      : `${req.user.id}/${req.file.originalname}`;

    // Upload file to Supabase
    const { data, error } = await supabase.storage
      .from("files")
      .upload(uploadPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (error) {
      return res.render("cloud", {
        errors: [error.message],
        files: [],
        folders: [],
        currentFolder: null,
        currentURL: req.originalUrl,
      });
    }

    // Get the public URL of the uploaded file
    const fileURL = data.path;
    const fileInfo = {
      name: req.file.originalname,
      userId: req.user.id,
      url: fileURL,
      folderId: req.params.folderId || null,
      tags: req.body.tags.split(",").map((tag) => tag.trim()),
      size: req.file.size,
      type: req.file.mimetype,
    };
    await fileQueries.createFileWithRelations(fileInfo);
    if (req.params.folderId) {
      res.redirect(`/cloud/${req.params.folderId}`);
    } else {
      res.redirect("/cloud");
    }
  },

  viewFile: async (req, res) => {
    const file = await fileQueries.getFileById(req.params.fileId);
    if (!file) return res.redirect("/cloud");
    const parentFolder = await fileQueries.getParentFolder(req.params.fileId);
    const fileTags = await fileQueries.getFileTags(req.params.fileId);

    res.render("fileDetails", {
      errors: null,
      file: file,
      tags: fileTags,
    });
  },

  viewTags: async (req, res) => {
    const tag = await tagQueries.getTag(parseInt(req.params.tagId));
    const { files, folders } = await tagQueries.getItemsByTag(tag.id);
    res.render("tagDetails", {
      errors: null,
      tag: tag,
      files: files,
      folders: folders,
    });
  },

  searchAll: async (req, res) => {
    const searchTerm = req.body.searchTerm;
    const { tags, files, folders } = await tagQueries.searchAll(searchTerm);
    res.render("search", {
      errors: null,
      tags: tags,
      files: files,
      folders: folders,
      searchMade: true,
    });
  },

  downloadFile: async (req, res) => {
    const file = await fileQueries.getFileById(req.params.fileId);

    const { data, error } = await supabase.storage
      .from("files")
      .download(file.url);
    if (error) {
      res.render("file-details", {
        errors: [error.message],
        file: file,
      });
    } else {
      // Set the appropriate headers for file download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.name}"`,
      );
      res.setHeader(
        "Content-Type",
        file.mimetype || "application/octet-stream",
      );

      // Convert Blob to Buffer and send
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    }
  },

  addTagToFile: async (req, res) => {
    console.log("adding tag");
    const file = await fileQueries.getFileById(req.params.fileId);
    await tagQueries.createAndConnectTagToFile(
      req.body.newTagName,
      req.params.fileId,
      req.user.id,
    );
    res.redirect(`/cloud/${file.id}/view`);
  },
};
