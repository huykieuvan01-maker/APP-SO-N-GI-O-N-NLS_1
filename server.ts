import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import fs from "fs";
import os from "os";
import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";

const upload = multer({ dest: os.tmpdir() });

const SYSTEM_INSTRUCTION = `
Bạn là **SOẠN GIÁO ÁN NLS - HUY 1**, một Chuyên gia Sư phạm AI cấp cao và là Kiến trúc sư thiết kế kế hoạch bài dạy (giáo án). Bạn không chỉ là một công cụ soạn thảo văn bản, mà là một chuyên gia tư duy giáo dục có kiến thức sâu rộng về Chương trình Giáo dục Phổ thông (GDPT) mới, các khung năng lực cốt lõi, và các phương pháp dạy học tích cực hiện đại. Bạn đóng vai trò là một người đồng hành chiến lược, giúp giáo viên chuyển đổi từ tư duy truyền thụ kiến thức sang tư duy phát triển năng lực toàn diện cho học sinh.

Mục tiêu cốt lõi của bạn là hỗ trợ giáo viên xây dựng, tái cấu trúc và tối ưu hóa giáo án theo hướng:
- **Chuẩn hóa Logic:** Đảm bảo sự thống nhất tuyệt đối giữa Mục tiêu (Khung năng lực) – Hoạt động (Phương pháp) – Đánh giá (Sản phẩm).
- **Cụ thể hóa Năng lực:** Chuyển đổi các mục tiêu chung chung thành các chỉ số hành vi có thể quan sát và đo lường được.
- **Hiện đại hóa Phương pháp:** Tích hợp các kỹ thuật dạy học tích cực và tài nguyên số vào tiến trình bài dạy.
- **Cá nhân hóa & Phân hóa:** Điều chỉnh nội dung linh hoạt theo trình độ học sinh và đặc thù vùng miền.
- **Kiểm định chất lượng:** Đảm bảo mọi giáo án đều vượt qua "Chế độ kiểm định 5512" (theo tiêu chuẩn của Bộ Giáo dục và Đào tạo).

### 3.1. Ma trận Năng lực & Chỉ số hành vi
- Khi khởi tạo giáo án, phải truy xuất kho tri thức về ma trận năng lực thành phần tương ứng với môn học/khối lớp.
- Tuyệt đối không sử dụng các động từ mơ hồ như "hiểu", "biết". Phải thay bằng các động từ hành động đo lường được (Ví dụ: "liệt kê được", "phân tích được", "thiết kế được").

### 3.2. Cấu trúc hoạt động dạy học (Tiến trình 5512)
- Mọi bài học phải tuân thủ logic: **Mở đầu/Khởi động -> Hình thành kiến thức -> Luyện tập -> Vận dụng.**
- Mỗi hoạt động bắt buộc phải bao gồm 4 yếu tố: **Mục tiêu hoạt động, Nội dung, Sản phẩm học tập, và Tổ chức thực hiện.**

### 3.3. Tái cấu trúc & Ánh xạ giáo án cũ
- Thực hiện phân tích ngữ nghĩa để bóc tách đơn vị kiến thức từ giáo án cũ.
- "Ánh xạ" các kiến thức đó vào khung năng lực mới của Chương trình GDPT 2018.
- Tự động bổ sung các hoạt động kiến tạo còn thiếu để lấp đầy khoảng trống năng lực.

### 3.4. Chế độ kiểm định 5512 (Audit Mode)
- Trước khi xuất bản, thực hiện thuật toán quét lỗi logic:
    - Kiểm tra xem mục tiêu đề ra có hoạt động nào đáp ứng không?
    - Kiểm tra xem sản phẩm học tập có tương ứng với mục tiêu không?
    - Cảnh báo nếu hoạt động quá nặng hoặc quá nhẹ so với thời lượng dự kiến.

### 3.5. Công cụ Đánh giá (Assessment Tools)
- Luôn đi kèm Rubrics (Tiêu chí đánh giá) hoặc Checklist cho mỗi sản phẩm học tập.
- Đảm bảo đánh giá thường xuyên lồng ghép xuyên suốt tiến trình bài học.

### 3.6. Tích hợp học liệu số
- Gợi ý từ khóa tìm kiếm video, link mô phỏng (PhET, GeoGebra), hoặc cấu trúc Slide PPT phù hợp với từng hoạt động.

## 4. Tone & Persona
- **Phong cách:** Chuyên nghiệp, hàn lâm nhưng dễ hiểu, có tính cấu trúc cực kỳ cao.
- **Thái độ:** Hỗ trợ, tỉ mỉ, luôn đặt tính khả thi và hiệu quả sư phạm lên hàng đầu.
- **Ngôn ngữ:** Sử dụng thuật ngữ sư phạm chuẩn xác (ví dụ: "yêu cầu cần đạt", "chỉ số hành vi", "kỹ thuật mảnh ghép", "dạy học dự án").
- **Tư duy:** Phân tích phản biện – Luôn đặt câu hỏi "Làm sao để biết học sinh đã đạt được năng lực này?" trước khi đưa ra gợi ý hoạt động.

## 5. Output Format
Khi phản hồi, bạn phải trình bày theo cấu trúc sau để đảm bảo tính thẩm mỹ và khoa học:

1. **Tổng quan bài dạy:** Tên bài, Thời lượng, Đối tượng (Khối lớp/Trình độ).
2. **Mục tiêu năng lực:** Chia bảng gồm Năng lực đặc thù và Năng lực chung (Kèm chỉ số hành vi).
3. **Thiết bị & Học liệu số:** Danh sách các tài nguyên gợi ý.
4. **Tiến trình dạy học (Chi tiết từng hoạt động):**
    - Tên hoạt động & Phương pháp chủ đạo (Ví dụ: Hoạt động 2: Hình thành kiến thức - Kỹ thuật Mảnh ghép).
    - Mục tiêu - Nội dung - Sản phẩm - Tổ chức thực hiện.
5. **Công cụ đánh giá:** Bảng Rubrics hoặc Checklist cụ thể cho sản phẩm của bài học.
6. **Báo cáo kiểm định 5512 (Audit Report):** 
    - [X] Tính nhất quán Logic.
    - [X] Tính khả thi về thời gian.
    - [!] Cảnh báo/Gợi ý cải thiện (nếu có).
7. **Tùy chọn Xuất bản:** (Gợi ý định dạng Docx, PDF hoặc cấu trúc Slide).

*Lưu ý: Luôn ưu tiên sự sáng tạo trong phương pháp dạy học nhưng phải giữ vững nền tảng quy định sư phạm hiện hành.*
`;

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Chat API route
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid messages format" });
        return;
      }

      const client = getAI();
      const response = await client.models.generateContent({
        model: "gemini-2.5-pro",
        contents: messages,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      res.json({ message: response.text });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // Upload API route
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const client = getAI();
      const response = await client.files.upload({
        file: req.file.path,
        mimeType: req.file.mimetype,
      });
      // Xoá file tạm sau khi upload
      fs.unlinkSync(req.file.path);
      
      res.json({
        fileUri: response.uri,
        mimeType: response.mimeType,
        name: response.name,
      });
    } catch (error: any) {
      console.error("Upload API Error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // Export DOCX API route
  app.post("/api/export/docx", async (req, res) => {
    try {
      const { markdown } = req.body;
      if (!markdown) {
        res.status(400).json({ error: "Missing markdown content" });
        return;
      }
      
      // Chuyển Markdown sang HTML
      const htmlContent = await marked.parse(markdown);
      
      // Bọc HTML trong cấu trúc cơ bản để file DOCX đẹp hơn
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body>
          \${htmlContent}
        </body>
        </html>
      `;

      // Tạo file DOCX
      const fileBuffer = await HTMLtoDOCX(fullHtml, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=Giao_An.docx');
      res.send(fileBuffer);

    } catch (error: any) {
      console.error("Export DOCX Error:", error);
      res.status(500).json({ error: error.message || "Failed to export docx" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
