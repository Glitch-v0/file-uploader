import { folderQueries, fileQueries, tagQueries } from "../queries/queries.js";
import { prisma, supabase } from "../app.js";
import {
  createAndConnectTagsToFile,
  createAndConnectTagsToFolder,
} from "../lib/createAndConnectTags.js";

export const getCloudData = async (req, res) => {
  const currentFolders = await folderQueries.getOrphanFolders();
  const currentFiles = await fileQueries.getOrphanFiles();

  res.render("cloud", {
    errors: null,
    files: currentFiles,
    folders: currentFolders,
    currentFolder: null,
    currentURL: req.originalUrl,
    previousFolder: null,
  });
};

export const getFolderData = async (req, res) => {
  const folderParameter = req.params.folderId;
  const parentFolder = await folderQueries.getFolder(folderParameter);
  if (!parentFolder) return res.redirect("/cloud");

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
};

export const createFolder = async (req, res, next) => {
  const currentParentFolder = req.params.folderId;
  const newFolder = await folderQueries.createFolder(
    req.body.name,
    req.user.id,
  );

  if (currentParentFolder) {
    await folderQueries.assignParentToFolder(newFolder.id, currentParentFolder);
  }

  // Create and connect tags to folder
  createAndConnectTagsToFolder(req, res, newFolder.id);
  res.redirect(`/cloud/${newFolder.id}`);
};

export const uploadFile = async (req, res, next) => {
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

  // Upload the file to supabase
  const { data, error } = await supabase.storage
    .from("files")
    .upload(`uploads/${req.file.originalname}`, req.file.buffer, {
      contentType: req.file.mimetype,
    });
  if (error) {
    console.error("Error uploading file:", error);
  }
  console.log(`File uploaded: ${JSON.stringify(data, null, 2)}`);

  // Get the public URL of the uploaded file
  const fileURL = supabase.storage
    .from("files")
    .getPublicUrl(`uploads/${req.file.originalname}`);

  console.log(`File URL: ${fileURL.data.publicUrl}`);

  const fileInfo = {
    name: req.file.originalname,
    url: fileURL.data.publicUrl,
    folderId: req.params.folderId || null,
    ownerId: req.user.id,
    size: req.file.size,
    type: req.file.mimetype,
  };

  await fileQueries.createFile(fileInfo);
  createAndConnectTagsToFile(req, res, fileInfo.id);

  res.redirect(`/cloud/${req.params.folderId}`);
};

export const viewFile = async (req, res) => {
  const file = await fileQueries.getFileById(req.params.fileId);
  if (!file) return res.redirect("/cloud");

  const parentFolder = await fileQueries.getParentFolder(req.params.fileId);

  res.render("file-details", {
    errors: null,
    file: file,
    previousFolder: parentFolder?.folderId || "",
  });
};
