'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useState, useCallback, useMemo, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  // Define all state hooks first, before any other hooks
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  
  // Define memoized extensions to avoid recreating them on each render
  const extensions = useMemo(() => [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-500 underline cursor-pointer hover:text-blue-700',
      },
    }),
    Image.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: 'max-w-full rounded-lg shadow-md',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'border-b border-gray-200',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 p-2',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'bg-gray-100 font-bold border border-gray-300 p-2',
      },
    }),
  ], []);
  
  // Initialize editor after all state hooks
  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  // Add useEffect to update content when it changes externally
  useEffect(() => {
    if (editor && content) {
      // Only update if the content is different to avoid loops
      if (editor.getHTML() !== content) {
        console.log("Updating editor content from props:", content.substring(0, 50) + "...");
        editor.commands.setContent(content, false);
      }
    }
  }, [editor, content]);

  // Define all callbacks with useCallback to maintain consistent hook order
  const toggleBold = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }

    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const unsetLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  // Define all callbacks after the editor hook
  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  const createTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const setTextAlign = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
    if (!editor) return;
    editor.chain().focus().setTextAlign(align).run();
  }, [editor]);
  
  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor border border-gray-300 rounded-md overflow-hidden">
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex bg-white shadow-lg rounded-md border border-gray-200">
          <button
            onClick={toggleBold}
            className={`p-2 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={toggleItalic}
            className={`p-2 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={toggleUnderline}
            className={`p-2 ${editor.isActive('underline') ? 'bg-gray-100' : ''}`}
          >
            <span className="underline">U</span>
          </button>
          <button
            onClick={() => setShowLinkInput(true)}
            className={`p-2 ${editor.isActive('link') ? 'bg-gray-100' : ''}`}
          >
            Link
          </button>
        </div>
      </BubbleMenu>
      
      <div className="toolbar bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex space-x-1 mr-2">
          <button
            type="button"
            onClick={toggleBold}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-200' : ''
            }`}
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-200' : ''
            }`}
            title="Italic"
          >
            <span className="italic">I</span>
          </button>
          <button
            type="button"
            onClick={toggleUnderline}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('underline') ? 'bg-gray-200' : ''
            }`}
            title="Underline"
          >
            <span className="underline">U</span>
          </button>
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Headings */}
        <div className="flex space-x-1 mr-2">
          <button
            type="button"
            onClick={() => toggleHeading(1)}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
            }`}
            title="Heading 1"
          >
            <span className="font-bold">H1</span>
          </button>
          <button
            type="button"
            onClick={() => toggleHeading(2)}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
            }`}
            title="Heading 2"
          >
            <span className="font-bold">H2</span>
          </button>
          <button
            type="button"
            onClick={() => toggleHeading(3)}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
            }`}
            title="Heading 3"
          >
            <span className="font-bold">H3</span>
          </button>
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Text Alignment */}
        <div className="flex space-x-1 mr-2">
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
            }`}
            title="Align Left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
            }`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('right')}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
            }`}
            title="Align Right"
          >
            →
          </button>
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Lists */}
        <div className="flex space-x-1 mr-2">
          <button
            type="button"
            onClick={toggleBulletList}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-200' : ''
            }`}
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={toggleOrderedList}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-200' : ''
            }`}
            title="Ordered List"
          >
            1. List
          </button>
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Links */}
        <div className="flex mr-2">
          {!showLinkInput ? (
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className={`p-2 rounded hover:bg-gray-200 ${
                editor.isActive('link') ? 'bg-gray-200' : ''
              }`}
              title="Add Link"
            >
              Link
            </button>
          ) : (
            <div className="flex items-center">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={setLink}
                className="ml-1 p-1 bg-blue-500 text-white rounded text-sm"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="ml-1 p-1 bg-gray-300 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {editor.isActive('link') && (
            <button
              type="button"
              onClick={unsetLink}
              className="p-2 rounded hover:bg-gray-200 bg-gray-200 ml-1"
              title="Remove Link"
            >
              Unlink
            </button>
          )}
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Images */}
        <div className="flex mr-2">
          {!showImageInput ? (
            <button
              type="button"
              onClick={() => setShowImageInput(true)}
              className="p-2 rounded hover:bg-gray-200"
              title="Add Image"
            >
              Image
            </button>
          ) : (
            <div className="flex items-center">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={addImage}
                className="ml-1 p-1 bg-blue-500 text-white rounded text-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowImageInput(false)}
                className="ml-1 p-1 bg-gray-300 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="border-l border-gray-300 mx-1"></div>

        {/* Tables */}
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={createTable}
            className="p-2 rounded hover:bg-gray-200"
            title="Insert Table"
          >
            Table
          </button>
          
          {editor.isActive('table') && (
            <>
              <button
                type="button"
                onClick={addColumnBefore}
                className="p-2 rounded hover:bg-gray-200"
                title="Add Column Before"
              >
                ←Col
              </button>
              <button
                type="button"
                onClick={addColumnAfter}
                className="p-2 rounded hover:bg-gray-200"
                title="Add Column After"
              >
                Col→
              </button>
              <button
                type="button"
                onClick={deleteColumn}
                className="p-2 rounded hover:bg-gray-200"
                title="Delete Column"
              >
                -Col
              </button>
              <button
                type="button"
                onClick={addRowBefore}
                className="p-2 rounded hover:bg-gray-200"
                title="Add Row Before"
              >
                ↑Row
              </button>
              <button
                type="button"
                onClick={addRowAfter}
                className="p-2 rounded hover:bg-gray-200"
                title="Add Row After"
              >
                Row↓
              </button>
              <button
                type="button"
                onClick={deleteRow}
                className="p-2 rounded hover:bg-gray-200"
                title="Delete Row"
              >
                -Row
              </button>
              <button
                type="button"
                onClick={deleteTable}
                className="p-2 rounded hover:bg-gray-200"
                title="Delete Table"
              >
                ×Table
              </button>
            </>
          )}
        </div>
      </div>

      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
      />
    </div>
  );
};

export default RichTextEditor;
