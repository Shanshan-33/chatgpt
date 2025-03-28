import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";

/**
 * 聊天消息组件
 * @param {string} role - 消息角色 (user/assistant)
 * @param {string} content - 消息内容
 * @param {boolean} isLast - 是否为最后一条消息
 * @param {boolean} isStreaming - 是否正在流式传输
 */
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
    if (isUser || !content) return;

    const processAssistantContent = () => {
      const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
      let thinking = "";
      let answer = content;

      // 检查是否有未闭合的思考标签
      const openTagCount = (content.match(/<think>/g) || []).length;
      const closeTagCount = (content.match(/<\/think>/g) || []).length;
      const isThinking = openTagCount > closeTagCount;

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

      // 提取已完成的思考内容
      const matches = [...content.matchAll(thinkRegex)];
      if (matches.length > 0) {
        thinking = matches.map((match) => match[1]).join("\n\n");
        answer = content.replace(thinkRegex, "");
      }

      return { thinking, answer, isThinking };
    };

    setProcessedContent(processAssistantContent());
  }, [content, isUser]);

  // 滚动到最新消息
  useEffect(() => {
    if (messageRef.current && isLast) {
      requestAnimationFrame(() => {
        messageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  }, [content, isLast, isStreaming]);

  // 渲染用户消息
  const renderUserMessage = () => <p>{content}</p>;

  // 渲染助手消息
  const renderAssistantMessage = () => (
    <div className="markdown-content">
      {/* 思考内容部分 */}
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

      {/* 回答内容部分 */}
      <div className="answer-content">
        <ReactMarkdown
          rehypePlugins={[rehypeSanitize]}
          remarkPlugins={[remarkGfm]}
        >
          {processedContent.answer}
        </ReactMarkdown>
      </div>
    </div>
  );

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
          {isUser ? renderUserMessage() : renderAssistantMessage()}
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
