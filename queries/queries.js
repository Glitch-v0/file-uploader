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

  searchAll: async (searchTerm) => {
    return prisma.$transaction(async () => {
      const [tags, files, folders] = await Promise.all([
        prisma.tag.findMany({
          where: {
            name: {
              contains: searchTerm,
            },
          },
          select: {
            name: true,
            id: true,
          },
        }),
        prisma.file.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: searchTerm,
                },
              },
              {
                tags: {
                  some: {
                    name: {
                      contains: searchTerm,
                    },
                  },
                },
              },
            ],
          },
          select: {
            name: true,
            id: true,
          },
        }),
        prisma.folder.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: searchTerm,
                },
              },
              {
                tags: {
                  some: {
                    name: {
                      contains: searchTerm,
                    },
                  },
                },
              },
            ],
          },
          select: {
            name: true,
            id: true,
          },
        }),
      ]);

      return { tags, files, folders };
    });
  },

  searchItemsForTerm: async (tag) => {
    return prisma.$transaction(async () => {
      const [files, folders] = await Promise.all([
        prisma.file.findMany({
          where: {
            tags: {
              some: {
                name: tag,
              },
            },
          },
          select: {
            name: true,
            id: true,
          },
        }),
        prisma.folder.findMany({
          where: {
            tags: {
              some: {
                name: tag,
              },
            },
          },
          select: {
            name: true,
            id: true,
          },
        }),
      ]);

      return { files, folders };
    });
  },

  getTag: async (tagId) => {
    return prisma.tag.findUnique({
      where: {
        id: tagId,
      },
    });
  },

  getItemsByTag: async (tagId) => {
    return prisma.$transaction(async () => {
      const [files, folders] = await Promise.all([
        prisma.file.findMany({
          where: {
            tags: {
              some: {
                id: tagId,
              },
            },
          },
          select: {
            name: true,
            id: true,
          },
        }),
        prisma.folder.findMany({
          where: {
            tags: {
              some: {
                id: tagId,
              },
            },
          },
          select: {
            name: true,
            id: true,
          },
        }),
      ]);

      return { files, folders };
    });
  },

  updateTagName: async (tagId, newName) => {
    console.log({ tagId, newName });
    return prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        name: newName,
      },
    });
  },

  deleteTag: async (tagId) => {
    return prisma.tag.delete({
      where: {
        id: tagId,
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
          parentFolderId: parentFolderId,
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

  getFolderAndTags: (folderId) => {
    return prisma.folder.findUnique({
      where: {
        id: folderId,
      },
      include: {
        tags: true,
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

  updateFolderName: (folderId, folderName) => {
    console.log({ folderId, folderName });
    return prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name: folderName,
      },
    });
  },

  deleteFolders: async (foldersToDelete) => {
    // Make sure operations happen together
    return await prisma.$transaction(async (prisma) => {
      // Delete files
      await prisma.file.deleteMany({
        where: {
          folderId: { in: foldersToDelete },
        },
      });

      // Delete folders
      return await prisma.folder.deleteMany({
        where: {
          id: { in: foldersToDelete },
        },
      });
    });
  },

  // Helper function to recursively gather all folder IDs
  getAllFolderIds: async (folderId) => {
    const folderIds = [folderId];

    // Get all immediate child folders for the given folderId
    const childFolders = await prisma.folder.findMany({
      where: {
        parentFolderId: folderId,
      },
      select: {
        id: true,
      },
    });

    // If there are child folders, gather their IDs recursively
    for (const child of childFolders) {
      const childFolderIds = await folderQueries.getAllFolderIds(child.id);
      folderIds.push(...childFolderIds);
    }

    return folderIds;
  },

  // Share folder and children
  makeFolderChildrenShareable: async (folderId, days) => {
    const foldersToChange = await folderQueries.getAllFolderIds(folderId);
    const filesToChange =
      await fileQueries.getFileIdsByFolders(foldersToChange);
    const expirationDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    console.log({ expirationDate });

    await prisma.folder.updateMany({
      where: {
        id: { in: foldersToChange },
      },
      data: {
        shareExpirationDate: expirationDate.toISOString(),
      },
    });

    await prisma.file.updateMany({
      where: {
        id: { in: filesToChange },
      },
      data: {
        shareExpirationDate: expirationDate.toISOString(),
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

  getFileIdsByFolders: async (folderIds) => {
    const files = await prisma.file.findMany({
      where: {
        folderId: { in: folderIds },
      },
      select: {
        id: true,
      },
    });

    return files.map((file) => file.id);
  },

  getFileUrlsByFolders: async (folderIds) => {
    const files = await prisma.file.findMany({
      where: {
        folderId: { in: folderIds },
      },
      select: {
        url: true,
      },
    });

    return files.map((file) => file.url);
  },

  getFileById: (fileId) => {
    return prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });
  },

  getFileTags: (fileId) => {
    return prisma.file.findUnique({
      where: {
        id: fileId,
      },
      select: {
        tags: true,
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

  updateFile: (fileId, newName, newURL) => {
    return prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        name: newName,
        url: newURL,
      },
    });
  },

  deleteFile: (fileId) => {
    return prisma.file.delete({
      where: {
        id: fileId,
      },
    });
  },
};
