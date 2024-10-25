import prisma from "../app.js";

export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

export async function isAuthorized(req, res, next, idHash) {
  //First case, file or folder belongs to user
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
      files: {
        some: {
          id: idHash,
        },
      },
      folders: {
        some: {
          id: idHash,
        },
      },
      tags: {
        some: {
          id: idHash,
        },
      },
    },
  });

  if (!user) {
    throw new Error("You are not authorized to view this page");
  }

  return next();
}
