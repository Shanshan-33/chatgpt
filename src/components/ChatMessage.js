import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";

function ChatMessage({ role, content, isLast, isStreaming }) {
  const isUser = role === "user";
  const messageRef = useRef(null);
  const [processedContent, setProcessedContent] = useState({
    thinking: "",
    answer: "",
    isThinking: false,
  });

  // 处理内容，分离思考过程和回答
  useEffect(() => {
    if (!isUser && content) {
      const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
      let thinking = "";
      let answer = content;
      let isThinking = false;

      // 检查是否有未闭合的思考标签
      const openTagCount = (content.match(/<think>/g) || []).length;
      const closeTagCount = (content.match(/<\/think>/g) || []).length;
      isThinking = openTagCount > closeTagCount;

      // 提取所有思考内容
      const matches = [...content.matchAll(thinkRegex)];
      if (matches.length > 0) {
        thinking = matches.map((match) => match[1]).join("\n\n");
        // 从原始内容中移除思考部分
        answer = content.replace(thinkRegex, "");
      }

      // 处理未闭合的思考标签内容
      if (isThinking) {
        const lastThinkMatch = content.lastIndexOf("<think>");
        if (lastThinkMatch !== -1) {
          const currentThinking = content.substring(lastThinkMatch + 7); // 7 是 <think> 的长度
          thinking = thinking
            ? thinking + "\n\n" + currentThinking
            : currentThinking;
          answer = content.substring(0, lastThinkMatch);
        }
      }

      setProcessedContent({ thinking, answer, isThinking });
    }
  }, [content, isUser]);

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
        <div className={`message-text ${isStreaming ? "streaming" : ""}`}>
          {isUser ? (
            <p>{content}</p>
          ) : (
            <div className="markdown-content">
              {(processedContent.thinking || processedContent.isThinking) && (
                <div className="thinking-content">
                  <ReactMarkdown
                    rehypePlugins={[rehypeSanitize]}
                    remarkPlugins={[remarkGfm]}
                  >
                    {processedContent.thinking}
                  </ReactMarkdown>
                </div>
              )}

              <div className="answer-content">
                <ReactMarkdown
                  rehypePlugins={[rehypeSanitize]}
                  remarkPlugins={[remarkGfm]}
                >
                  {processedContent.answer}
                </ReactMarkdown>
              </div>
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
