import { folderQueries, fileQueries, tagQueries } from "../queries/queries.js";

export const shareController = {
  renderShareForm: async (req, res) => {
    const folder = await folderQueries.getFolder(req.params.folderId);
    res.render("shareForm", { sharedFolder: folder });
  },

  renderShareLinkForm: async (req, res) => {
    const createShareLinks = await folderQueries.makeFolderChildrenShareable(
      req.params.folderId,
      req.body.days,
    );
    const folder = await folderQueries.getFolder(req.params.folderId);

    // Add link and days to folder and children

    res.render("shareLink", { sharedFolder: folder, errors: null });
  },

  viewSharedFolder: async (req, res) => {
    const folder = await folderQueries.getFolder(req.params.folderId);

    // Compare current expiration date with current date
    if (folder.shareExpirationDate < new Date()) {
      return res.render("cloudShare", {
        errors: [
          { msg: "Access Denied: Link Expired. Please request a new one." },
        ],
        currentFolder: null,
        folders: [],
        files: [],
      });
    }

    const childFolders = await folderQueries.getFolderChildren(folder.id);
    const childFiles = await fileQueries.getFilesByFolder(folder.id);
    res.render("cloudShare", {
      errors: null,
      currentFolder: folder,
      folders: childFolders,
      files: childFiles,
    });
  },

  viewSharedFile: async (req, res) => {
    const file = await fileQueries.getFileById(req.params.fileId);
    res.render("sharedFileDetails", {
      errors: null,
      file: file,
    });
  },
};
