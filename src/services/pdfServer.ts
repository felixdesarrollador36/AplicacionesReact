// import express, { Express } from 'express';
// import cors from 'cors';
// import * as fs from 'fs';
// import * as path from 'path';

// let server: any = null;
// const PORT = 8888;

// export const startPdfServer = (documentsPath: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     if (server) {
//       resolve(`http://localhost:${PORT}`);
//       return;
//     }

//     try {
//       const app: Express = express();
//       app.use(cors());

//       app.get('/pdf/:filename', (req, res) => {
//         const filename = req.params.filename;
//         const filepath = path.join(documentsPath, filename);

//         if (!fs.existsSync(filepath)) {
//           return res.status(404).send('PDF not found');
//         }

//         res.setHeader('Content-Type', 'application/pdf');
//         res.sendFile(filepath);
//       });

//       server = app.listen(PORT, () => {
//         console.log(`PDF Server running on http://localhost:${PORT}`);
//         resolve(`http://localhost:${PORT}`);
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

// export const stopPdfServer = () => {
//   if (server) {
//     server.close();
//     server = null;
//   }
// };