import multer from "multer";    
//memeory storage keeps file in memory as req.file.buffer
const storage = multer.memoryStorage();
//file filter to only accept images
function fileFilter(req: Express.Request,
     file: Express.Multer.File,
     cb: multer.FileFilterCallback) {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp" ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);//accept file
        } else {
            cb(new Error("Invalid file type. Only images are allowed.(jpeg, png, gif, webp)"));
        } 
    }
    const upload = multer({ storage, fileFilter });
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
export default upload;  
  
  