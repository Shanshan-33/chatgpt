import { useState, useEffect, useRef } from "react";
import "./App.css";
import ChatMessage from "./components/ChatMessage";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || isLoading) return;

    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // 清空输入框和流式消息
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    try {
      // 尝试使用流式API
      const response = await fetch(`http://localhost:11434/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify({
          model: "deepseek-r1:1.5b",
          prompt: currentInput,
          stream: true,
        }),
      });

      // 处理流式响应
      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let accumulatedMessage = "";
        let assistantMessageAdded = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (done) break;

          const chunk = decoder.decode(value);
          // Ollama API 返回的每一行都是一个完整的 JSON 对象
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            try {
              const data = JSON.parse(line);

              if (data.done) {
                // 流结束
                setIsStreaming(false);
              } else if (data.response) {
                // Ollama API 使用 response 字段而不是 chunk
                accumulatedMessage += data.response;

                // 如果这是第一个响应块，添加新的助手消息
                if (!assistantMessageAdded) {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: accumulatedMessage },
                  ]);
                  assistantMessageAdded = true;
                } else {
                  // 更新消息列表中的最后一条消息
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content =
                      accumulatedMessage;
                    return newMessages;
                  });
                }
              }
            } catch (e) {
              console.error(
                "Error parsing streaming data",
                e,
                "Raw line:",
                line
              );
            }
          }
        }
      } else {
        // 如果流式API失败
        console.warn("流式API失败");
      }
    } catch (error) {
      console.error("Error with streaming:", error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>AI Chat Assistant</h1>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>欢迎使用 AI 助手 | Welcome to AI Assistant</h2>
              <p>请输入您的问题 | Please enter your question</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                isLast={index === messages.length - 1}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))
          )}
          <div ref={messagesEndRef} className="scroll-anchor" />
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || input.trim() === ""}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
