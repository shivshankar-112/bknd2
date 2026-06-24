import ImageKit from "imagekit";

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_rNPLFn1SGrHHKFQDljelPSsYGSo=",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_Pti+l8mmVvn72rZVB7no/GR6hlA=",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/yfywhmlad",
});