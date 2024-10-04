import prisma from "../app.js";

export const tagQueries = {
  checkIfTagExists: (tagName, userId) => {
    return prisma.tag.findUnique({
      where: {
        name: tagName,
        ownerId: userId,
      },
    });
  },
  createTags: (tags, userId) => {
    prisma.tag.createMany({
      data: tags.map((tag) => ({
        name: tag,
        ownerId: userId,
      })),
    });
  },
  connectTagsToFolder: (tags, userId, folderId) => {
    prisma.tag.updateMany({
      where: {
        ownerId: userId,
        name: {
          in: tags,
        },
      },
      data: {
        folders: {
          connect: {
            id: folderId,
          },
        },
      },
    });
  },
};

export const folderQueries = {
  createFolder: (folderName, userId) => {
    return prisma.folder.create({
      data: {
        name: folderName,
        ownerId: userId,
      },
    });
  },

  getFolder: (folderId) => {
    return prisma.folder.findUnique({
      where: {
        id: folderId,
      },
    });
  },

  getOrphanFolders: (userId) => {
    return prisma.folder.findMany({
      where: {
        ownerId: userId,
        parentFolderId: null,
      },
    });
  },

  getFolderChildren: (folderId) => {
    return prisma.folder.findMany({
      where: {
        parentFolderId: folderId,
      },
    });
  },

  assignParentToFolder: (childFolderId, parentFolderId) => {
    return prisma.folder.update({
      where: {
        id: childFolderId,
      },
      data: {
        parentFolderId: parentFolderId,
      },
    });
  },
};
