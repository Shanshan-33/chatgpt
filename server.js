const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3002;
const apiKey = "";

// 设置 OpenAI API 的基础 URL
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

app.use(cors());
app.use(bodyParser.json());

// 普通聊天 API
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一个有用的助手，能够用中文和英文回答问题。",
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API 错误:", error.response?.data || error.message);
    res.status(500).json({ error: "处理请求时出错" });
  }
});

// 流式聊天 API --这个不好使
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "消息不能为空" });
    }

    // 设置 SSE 头部
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "deepseek-r1:1.5b",
        messages: [
          {
            role: "system",
            content: "你是一个有用的助手，能够用中文和英文回答问题。",
          },
          { role: "user", content: message },
        ],
        stream: true,
      }
      // {
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${apiKey}`,
      //   },
      //   responseType: "stream",
      // }
    );

    // 处理流式响应
    response.data.on("data", (chunk) => {
      const lines = chunk
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "" && line.trim() !== "data: [DONE]");

      for (const line of lines) {
        if (line.includes("data: ")) {
          try {
            const jsonData = JSON.parse(line.replace("data: ", ""));
            const content = jsonData.choices[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
            }
          } catch (e) {
            console.error("解析流数据错误:", e);
          }
        }
      }
    });

    response.data.on("end", () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    response.data.on("error", (err) => {
      console.error("流响应错误:", err);
      res.status(500).end();
    });
  } catch (error) {
    console.error(
      "OpenAI 流式 API 错误:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "处理流式请求时出错" });
  }
});

// // 如果没有 OpenAI API 密钥，提供模拟响应
// if (!process.env.OPENAI_API_KEY) {
//   console.warn("警告: 未设置 OPENAI_API_KEY 环境变量，将使用模拟响应");

//   // 覆盖普通聊天 API
//   app.post("/api/chat", (req, res) => {
//     const { message } = req.body;

//     setTimeout(() => {
//       res.json({
//         response: `这是对 "${message}" 的模拟响应。请设置 OPENAI_API_KEY 环境变量以使用真实的 OpenAI API。\n\nThis is a mock response to "${message}". Please set the OPENAI_API_KEY environment variable to use the real OpenAI API.`,
//       });
//     }, 1000); // 模拟延迟
//   });

//   // 覆盖流式聊天 API
//   app.post("/api/chat/stream", (req, res) => {
//     const { message } = req.body;

//     // 设置 SSE 头部
//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Connection", "keep-alive");

//     const mockResponse = `这是对 "${message}" 的模拟流式响应。请设置 OPENAI_API_KEY 环境变量以使用真实的 OpenAI API。\n\nThis is a mock streaming response to "${message}". Please set the OPENAI_API_KEY environment variable to use the real OpenAI API.`;

//     // 模拟流式响应
//     let index = 0;
//     const interval = setInterval(() => {
//       if (index < mockResponse.length) {
//         const chunk = mockResponse.charAt(index);
//         res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
//         index++;
//       } else {
//         clearInterval(interval);
//         res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
//         res.end();
//       }
//     }, 50); // 每50毫秒发送一个字符
//   });
// }

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
