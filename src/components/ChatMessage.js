import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";

function ChatMessage({ role, content, isLast, isStreaming }) {
  const isUser = role === "user";
  const messageRef = useRef(null);

  // 当新消息出现或内容更新时，滚动到底部
  useEffect(() => {
    if (messageRef.current && isLast) {
      // 使用 requestAnimationFrame 确保在渲染后滚动
      requestAnimationFrame(() => {
        messageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  }, [content, isLast, isStreaming]); // 添加所有可能触发滚动的依赖项

  return (
    <div
      className={`chat-message ${
        isUser ? "user-message" : "assistant-message"
      }`}
      ref={messageRef}
    >
      <div className="message-avatar">{isUser ? "👤" : "🤖"}</div>
      <div className="message-content">
        <div className="message-role">{isUser ? "You" : "AI Assistant"}</div>

        {/* 思考中标签 */}
        {/* {isStreaming && !isUser && (
          <div className="thinking-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            思考中... | Thinking...
          </div>
        )} */}

        <div className={`message-text ${isStreaming ? "streaming" : ""}`}>
          {isUser ? (
            <p>{content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                rehypePlugins={[rehypeSanitize]}
                remarkPlugins={[remarkGfm]}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {isStreaming && isLast && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
