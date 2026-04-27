import multer from "multer";    
//memeory storage keeps file in memory as req.file.buffer
const storage = multer.memoryStorage();
//file filter to only accept images
function fileFilter(req: Express.Request,
     file: Express.Multer.File,
     cb: multer.FileFilterCallback) {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        console.log(`[Multer Debug] File received:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            fieldname: file.fieldname
        });
        if (allowedTypes.includes(file.mimetype)) {
            console.log(`[Multer Debug] ✓ File accepted`);
            cb(null, true);//accept file
        } else {
            console.log(`[Multer Debug] ✗ File rejected - MIME type "${file.mimetype}" not in allowed list:`, allowedTypes);
            cb(new Error("Invalid file type. Only images are allowed.(jpeg, png, gif, webp)"));
        } 
    }
    const upload = multer({ 
        storage, 
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
    });
export default upload;  
  
  
