import { tagQueries } from "../queries/queries.js";

export const createAndConnectTagsToFolder = async (req, res, folderId) => {
  // Parse through form tags
  const folderTags = req.body.tags.split(",").map((tag) => tag.trim());

  // Skip if no tags
  if (folderTags == [""]) return;

  for (const tag of folderTags) {
    // Create tag if it doesn't exist
    const tagExists = await tagQueries.checkIfTagExists(tag, req.user.id);
    if (!tagExists) {
      await tagQueries.createTag(tag, req.user.id);
    }

    // Connect tag to folder
    await tagQueries.connectTagToFolder(tag, req.user.id, folderId);
  }
};

export const createAndConnectTagsToFile = async (req, res, fileId) => {
  // Parse through form tags
  const fileTags = req.body.tags.split(",").map((tag) => tag.trim());

  // Skip if no tags
  if (fileTags == [""]) return;

  for (const tag of fileTags) {
    // Create tag if it doesn't exist
    const tagExists = await tagQueries.checkIfTagExists(tag, req.user.id);
    if (!tagExists) {
      await tagQueries.createTag(tag, req.user.id);
    }

    // Connect tag to file
    await tagQueries.connectTagToFolder(tag, req.user.id, fileId);
  }
};
