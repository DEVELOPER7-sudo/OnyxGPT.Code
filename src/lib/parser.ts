import { useProjectStore } from '@/store/projectStore';
import axios from 'axios';

type StoreActions = Pick<ReturnType<typeof useProjectStore['getState']>, 'addMessage' | 'addOrUpdateFile' | 'deleteFile' | 'renameFile'>;

enum ParseState { TEXT, TAG, CONTENT }
const CONTENT_TAGS = ['lov-thinking', 'lov-write'];

export class StreamingParser {
  private state: ParseState = ParseState.TEXT;
  private buffer: string = '';
  private currentTag: string = '';
  private currentFilePath: string = '';
  private actions: StoreActions;
  private projectId: string;

  constructor(actions: StoreActions, projectId: string) {
    this.actions = actions;
    this.projectId = projectId;
  }

  public parse(chunk: string) {
    this.buffer += chunk;
    let continueProcessing = true;
    while (continueProcessing) {
      continueProcessing = false;
      switch (this.state) {
        case ParseState.TEXT: {
          const tagStartIndex = this.buffer.indexOf('<');
          if (tagStartIndex !== -1) {
            const narrative = this.buffer.substring(0, tagStartIndex);
            if (narrative.trim()) {
              this.actions.addMessage({ type: 'narrative', content: narrative.trim() });
            }
            this.buffer = this.buffer.substring(tagStartIndex);
            this.state = ParseState.TAG;
            continueProcessing = true;
          }
          break;
        }
        case ParseState.TAG: {
          const tagEndIndex = this.buffer.indexOf('>');
          if (tagEndIndex !== -1) {
            const tagString = this.buffer.substring(0, tagEndIndex + 1);
            this.processTag(tagString);
            this.buffer = this.buffer.substring(tagEndIndex + 1);
            continueProcessing = true;
          }
          break;
        }
        case ParseState.CONTENT: {
          const closingTag = `</${this.currentTag}>`;
          const closingTagIndex = this.buffer.indexOf(closingTag);
          if (closingTagIndex !== -1) {
            const content = this.buffer.substring(0, closingTagIndex);
            this.processCapturedContent(content);
            this.buffer = this.buffer.substring(closingTagIndex + closingTag.length);
            this.state = ParseState.TEXT;
            continueProcessing = true;
          }
          break;
        }
      }
    }
  }

  private processTag(tagString: string) {
    const tagContent = tagString.slice(1, -1).trim();
    const parts = tagContent.split(/\s+/);
    const tagName = parts[0];

    if (tagName === 'lov-code' || tagName === '/lov-code') {
      this.state = ParseState.TEXT;
      return;
    }
    
    if (tagContent.endsWith('/')) {
      if (tagName === 'lov-rename') {
        const oldPathMatch = tagContent.match(/original_file_path="([^"]+)"/);
        const newPathMatch = tagContent.match(/new_file_path="([^"]+)"/);
        if (oldPathMatch && newPathMatch) {
          const oldPath = oldPathMatch[1];
          const newPath = newPathMatch[1];
          this.actions.renameFile(oldPath, newPath);
          this.performFileOperation({ type: 'rename', oldPath, newPath });
        }
      } else if (tagName === 'lov-delete') {
        const pathMatch = tagContent.match(/file_path="([^"]+)"/);
        if (pathMatch) {
          const path = pathMatch[1];
          this.actions.deleteFile(path);
          this.performFileOperation({ type: 'delete', path });
        }
      }
      this.state = ParseState.TEXT;
      return;
    }

    if (CONTENT_TAGS.includes(tagName)) {
      this.currentTag = tagName;
      if (tagName === 'lov-write') {
        const pathMatch = tagContent.match(/file_path="([^"]+)"/);
        this.currentFilePath = pathMatch ? pathMatch[1] : '';
      }
      this.state = ParseState.CONTENT;
    } else {
      this.state = ParseState.TEXT;
    }
  }

  private processCapturedContent(content: string) {
    switch (this.currentTag) {
      case 'lov-thinking':
        this.actions.addMessage({ type: 'thinking', content: content.trim() });
        break;
      case 'lov-write':
        if (this.currentFilePath) {
          const codeFenceRegex = /^```(?:[a-zA-Z]+)?\n([\s\S]*?)\n```$/;
          let finalContent = content.trim();
          const match = finalContent.match(codeFenceRegex);
          if (match && match[1]) {
            finalContent = match[1].trim();
          }
          this.actions.addOrUpdateFile({ path: this.currentFilePath, content: finalContent });
          this.performFileOperation({
            type: 'write',
            path: this.currentFilePath,
            content: finalContent
          });
        }
        break;
    }
    this.currentTag = '';
    this.currentFilePath = '';
  }

  private async performFileOperation(operation: { type: string, path?: string, content?: string, oldPath?: string, newPath?: string }) {
    try {
      await axios.post('http://localhost:3002/api/update-file', {
        projectId: this.projectId,
        operation: operation
      });
      console.log(`Successfully sent operation: ${operation.type}`);
    } catch (error) {
      console.error(`Failed to perform operation: ${operation.type}`, error);
      this.actions.addMessage({ type: 'system', content: `Error: Failed to write file ${operation.path}` });
    }
  }
}
