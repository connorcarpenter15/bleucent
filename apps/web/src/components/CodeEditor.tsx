'use client';

import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import type { WebsocketProvider } from 'y-websocket';

export type CodeEditorProps = {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  path?: string;
  language?: string;
  readOnly?: boolean;
  onLocalEdit?: (bytesChanged: number) => void;
};

/**
 * Monaco wrapper bound to a Yjs map of file paths. We pick the file's contents
 * out of the shared `code` map (a Y.Map of Y.Text), so multiple files in the
 * same room can be edited simultaneously without conflict.
 */
export function CodeEditor({
  doc,
  provider,
  path = 'main.py',
  language = 'python',
  readOnly = false,
  onLocalEdit,
}: CodeEditorProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);
  const lastLenRef = useRef(0);

  const handleMount: OnMount = (editor) => {
    const codeMap = doc.getMap('code');
    let yText = codeMap.get(path) as Y.Text | undefined;
    if (!yText) {
      yText = new Y.Text();
      codeMap.set(path, yText);
    }
    if (provider) {
      bindingRef.current = new MonacoBinding(
        yText,
        editor.getModel()!,
        new Set([editor]),
        provider.awareness,
      );
    }
    lastLenRef.current = yText.length;
    yText.observe((event) => {
      const newLen = (event.target as Y.Text).length;
      const delta = Math.abs(newLen - lastLenRef.current);
      lastLenRef.current = newLen;
      if (delta > 0 && !event.transaction.local) return;
      onLocalEdit?.(delta);
    });
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [path]);

  return (
    <Editor
      defaultLanguage={language}
      theme="vs-dark"
      onMount={handleMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
}
