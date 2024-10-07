import prisma from "../app.js";

export const tagQueries = {
  checkIfTagExists: (tagName, userId) => {
    return prisma.tag.findFirst({
      where: {
        name: tagName,
        ownerId: userId,
      },
    });
  },
  createTag: (tag, userId) => {
    return prisma.tag.create({
      data: {
        name: tag,
        ownerId: userId,
      },
    });
  },
  connectTagToFolder: async (tagName, userId, folderId) => {
    return prisma.tag.update({
      where: {
        ownerId_name: {
          ownerId: userId,
          name: tagName,
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

  getParentFolder: (folderId) => {
    return prisma.folder.findFirst({
      where: {
        id: folderId,
      },
      select: {
        parentFolderId: true,
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
