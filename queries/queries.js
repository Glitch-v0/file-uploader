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
  connectTagToFile: async (tagName, userId, fileId) => {
    return prisma.tag.update({
      where: {
        ownerId_name: {
          ownerId: userId,
          name: tagName,
        },
      },
      data: {
        files: {
          connect: {
            id: fileId,
          },
        },
      },
    });
  },
  createAndConnectTagsToFile: async (req, fileId) => {
    // Parse through form tags
    const fileTags = req.body.tags.split(",").map((tag) => tag.trim());

    // Skip if no tags
    if (fileTags[0] == "" && fileTags.length == 1) {
      console.log("No tags provided. Skipping.");
      return;
    }

    return prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        tags: {
          connectOrCreate: fileTags.map((tagName) => ({
            where: {
              ownerId_name: {
                name: tagName,
                ownerId: req.user.id,
              },
            },
            create: {
              name: tagName,
              ownerId: req.user.id,
            },
          })),
        },
      },
    });
  },
  createAndConnectTagsToFolder: async (req, folderId) => {
    // Parse through form tags
    const folderTags = req.body.tags.split(",").map((tag) => tag.trim());
    console.log({ folderTags });
    // Skip if no tags
    if (folderTags[0] == "" && folderTags.length == 1) {
      console.log("No tags provided. Skipping.");
      return;
    }

    return prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        tags: {
          connectOrCreate: folderTags.map((tagName) => ({
            where: {
              ownerId_name: {
                name: tagName,
                ownerId: req.user.id,
              },
            },
            create: {
              name: tagName,
              ownerId: req.user.id,
            },
          })),
        },
      },
    });
  },
};

export const folderQueries = {
  createFolderWithRelations: async (
    name,
    userId,
    parentFolderId = null,
    tags = [],
  ) => {
    return prisma.folder.create({
      data: {
        name,
        ownerId: userId,
        ...(parentFolderId && {
          parentFolder: {
            connect: {
              id: parentFolderId,
            },
          },
        }),
        ...(tags.length > 0 &&
          tags[0] !== "" && {
            tags: {
              connectOrCreate: tags.map((tagName) => ({
                where: {
                  ownerId_name: {
                    name: tagName,
                    ownerId: userId,
                  },
                },
                create: {
                  name: tagName,
                  ownerId: userId,
                },
              })),
            },
          }),
      },
      select: {
        id: true,
      },
    });
  },

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

export const fileQueries = {
  getOrphanFiles: (userId) => {
    return prisma.file.findMany({
      where: {
        ownerId: userId,
        folderId: null,
      },
    });
  },

  getFilesByFolder: (folderId) => {
    return prisma.file.findMany({
      where: {
        folderId: folderId,
      },
    });
  },

  getFileById: (fileId) => {
    return prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });
  },

  getParentFolder: (fileId) => {
    return prisma.file.findFirst({
      where: {
        id: fileId,
      },
      select: {
        folderId: true,
      },
    });
  },

  createFile: (file) => {
    return prisma.file.create({
      data: {
        name: file.name,
        url: file.url,
        folderId: file.folderId,
        ownerId: file.ownerId,
        tags: file.tags,
        size: file.size,
        type: file.type,
      },
    });
  },

  createFileWithRelations: async ({
    name,
    userId,
    url,
    folderId = null,
    tags = [],
    size,
    type,
  }) => {
    return prisma.file.create({
      data: {
        name,
        url,
        ownerId: userId,
        ...(folderId && {
          folderId: folderId,
        }),
        size,
        type,
        ...(tags.length > 0 &&
          tags[0] !== "" && {
            tags: {
              connectOrCreate: tags.map((tagName) => ({
                where: {
                  ownerId_name: {
                    name: tagName,
                    ownerId: userId,
                  },
                },
                create: {
                  name: tagName,
                  ownerId: userId,
                },
              })),
            },
          }),
      },
    });
  },

  getFileDownloadLink: (fileId) => {
    return prisma.file.findUnique({
      where: {
        id: fileId,
      },
      select: {
        url: true,
      },
    });
  },
};
