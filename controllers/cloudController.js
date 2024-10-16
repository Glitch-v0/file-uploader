import { folderQueries, fileQueries, tagQueries } from "../queries/queries.js";
import { prisma, supabase } from "../app.js";

export const getRootDirectoryData = async (req, res) => {
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
};

export const getFolderData = async (req, res) => {
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
};

export const createFolder = async (req, res, next) => {
  const currentParentFolder = req.params.folderId;

  const newFolder = await folderQueries.createFolderWithRelations(
    req.body.name,
    req.user.id,
    currentParentFolder,
    req.body.tags.split(",").map((tag) => tag.trim()),
  );

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
  const uploadPath = req.params.folderId
    ? `${req.user.id}/${req.params.folderId}/${req.file.originalname}`
    : `${req.user.id}/${req.file.originalname}`;

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

export const downloadFile = async (req, res) => {
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
};
