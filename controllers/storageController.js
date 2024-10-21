import { folderQueries, fileQueries, tagQueries } from "../queries/queries.js";
import { prisma, supabase } from "../app.js";

export const storageController = {
  getRootDirectoryData: async (req, res) => {
    const currentFolders = await folderQueries.getOrphanFolders();
    const currentFiles = await fileQueries.getOrphanFiles();

    res.render("cloud", {
      errors: null,
      files: currentFiles,
      folders: currentFolders,
      currentFolder: null,
      currentURL: "/cloud",
      previousFolder: null,
    });
  },

  getFolderData: async (req, res) => {
    const folderParameter = req.params.folderId;
    if (folderParameter == undefined) return res.redirect("/cloud");
    const parentFolder = await folderQueries.getFolder(folderParameter);
    if (!parentFolder) {
      return res.redirect("/cloud");
    }

    const childFolders = await folderQueries.getFolderChildren(parentFolder.id);
    const childFiles = await fileQueries.getFilesByFolder(parentFolder.id);

    res.render("cloud", {
      errors: null,
      files: childFiles,
      folders: childFolders,
      currentFolder: parentFolder.name,
      currentURL: req.originalUrl,
      previousFolder: parentFolder.parentFolderId || " ",
    });
  },

  createFolder: async (req, res, next) => {
    const currentParentFolder = req.params.folderId;

    const newFolder = await folderQueries.createFolderWithRelations(
      req.body.name,
      req.user.id,
      currentParentFolder,
      req.body.tags.split(",").map((tag) => tag.trim()),
    );

    res.redirect(`/cloud/${newFolder.id}`);
  },

  getFolderUpdateForm: async (req, res, next) => {
    const folder = await folderQueries.getFolder(req.params.folderId);
    console.log({ folder });
    res.render("updateItemName", {
      errors: null,
      item: folder,
      type: "folder",
      submissionURL: req.originalUrl,
      previousFolder: folder.parentFolderId || " ",
    });
  },

  getFileUpdateForm: async (req, res, next) => {
    console.log(req.params);
    console.log(`Passing file ${req.params.fileId} to prisma search query`);
    const file = await fileQueries.getFileById(req.params.fileId);
    console.log({ file });
    res.render("updateItemName", {
      errors: null,
      item: file,
      type: "file",
      submissionURL: req.originalUrl,
      previousFolder: file.folderId || " ",
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
    console.log(`Going back to folder ${folder.id}`);
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
        previousFolder: file.folderId || " ",
      });
    }

    // Supabase File update
    const currentURL = file.url;
    const newURL = currentURL.replace(file.name, newFileName);
    console.log(`Updating filename in supabase: ${file.url} to... ${newURL}`);
    const { data, error } = await supabase.storage
      .from("files")
      .move(file.url, newURL);

    if (error) {
      console.log({ error });
      throw new Error("Failed to rename file");
    }

    // Prisma File update
    const renamedFile = await fileQueries.updateFileName(
      req.params.fileId,
      newFileName,
    );
    if (renamedFile.folderId) {
      res.redirect(`/cloud/${renamedFile.folderId}`);
    }
    res.redirect(`/cloud`);
  },

  deleteFolder: async (req, res, next) => {
    // Recursively get all child folders and files
    const folderIds = await folderQueries.getAllFolderIds(req.params.folderId);
    const fileURLs = await fileQueries.getFilesByFolders(folderIds);
    console.log({ folderIds, fileURLs });

    // Supabase Folder deletion
    const supabaseSuccess = await supabase.storage
      .from("files")
      .remove(fileURLs);

    console.log({ success: supabaseSuccess });
    if (!supabaseSuccess) {
      throw new Error("Failed to delete folder from supabase");
    }

    // Prisma Folder deletion
    const dbSuccess = await folderQueries.deleteFolders(folderIds);
    if (!dbSuccess) {
      console.log({ dbSuccess });
      throw new Error("Failed to delete folder with prisma");
    }

    console.log("Just like that...gone");
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
    console.log("File deleted successfully");
  },

  uploadFile: async (req, res, next) => {
    // List existing buckets
    const { data: bucketList, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError.message);
    } else {
      console.log(`Current buckets: ${JSON.stringify(bucketList, null, 2)}`);

      // Create a new bucket if none exist
      if (bucketList.length === 0) {
        const { data: newBucket, error: createError } =
          await supabase.storage.createBucket("files");

        if (createError) {
          console.error("Error creating bucket:", createError.message);
        } else {
          console.log(
            `New bucket created: ${JSON.stringify(newBucket, null, 2)}`,
          );
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
        previousFolder: null,
      });
    }
    console.log({ data });
    console.log(`File uploaded: ${JSON.stringify(data, null, 2)}`);

    // Get the public URL of the uploaded file
    const fileURL = data.path;

    console.log(`File URL: ${fileURL}`);

    const fileInfo = {
      name: req.file.originalname,
      userId: req.user.id,
      url: fileURL,
      folderId: req.params.folderId || null,
      tags: req.body.tags.split(",").map((tag) => tag.trim()),
      size: req.file.size,
      type: req.file.mimetype,
    };
    console.log({ fileInfo });
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

    res.render("file-details", {
      errors: null,
      file: file,
      previousFolder: parentFolder?.folderId || "",
    });
  },

  downloadFile: async (req, res) => {
    console.log("Downloading file");

    // List files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from("files")
      .list(req.params.storageLocation);
    console.log({ files, listError });

    const { data, error } = await supabase.storage
      .from("files")
      .download(req.params.storageLocation);

    console.log({ data, error });
    if (error) {
      res.render("error", {
        errors: [error.message],
      });
    } else {
      console.log(`File downloaded: ${data.fullPath}`);
      res.download(data.fullPath);
    }
  },
};
