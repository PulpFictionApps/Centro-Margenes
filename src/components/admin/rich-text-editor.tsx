"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Minus,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

// ── Resizable image node view ─────────────────────────────────────────────────
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX.current = e.clientX;
      startWidth.current = imgRef.current?.offsetWidth ?? parseInt(node.attrs.width ?? "300");

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX.current;
        const newWidth = Math.max(40, startWidth.current + delta);
        updateAttributes({ width: `${newWidth}px` });
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [node.attrs.width, updateAttributes]
  );

  const floatVal = (node.attrs.float ?? "none") as "none" | "left" | "right";

  // The NodeViewWrapper itself is the floated element — sibling paragraphs wrap around it
  const outerStyle: React.CSSProperties = {
    position: "relative",
    width: node.attrs.width ?? "auto",
    maxWidth: "100%",
    ...(floatVal === "left"
      ? { float: "left", marginRight: "1.25rem", marginBottom: "0.5rem", clear: "none" }
      : floatVal === "right"
      ? { float: "right", marginLeft: "1.25rem", marginBottom: "0.5rem", clear: "none" }
      : { float: "none", display: "block" }),
  };

  return (
    <NodeViewWrapper style={outerStyle}>
      {/* Float toolbar — visible only when selected */}
      {selected && (
        <div
          style={{ position: "absolute", top: "-2.25rem", left: 0, zIndex: 50, whiteSpace: "nowrap" }}
          className="flex gap-0.5 rounded border border-neutral-300 bg-white px-1 py-0.5 shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); updateAttributes({ float: "left" }); }}
            className={`rounded px-2 py-0.5 text-xs font-medium ${floatVal === "left" ? "bg-brand text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
          >← Izquierda</button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); updateAttributes({ float: "none" }); }}
            className={`rounded px-2 py-0.5 text-xs font-medium ${floatVal === "none" ? "bg-brand text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
          >― Normal</button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); updateAttributes({ float: "right" }); }}
            className={`rounded px-2 py-0.5 text-xs font-medium ${floatVal === "right" ? "bg-brand text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
          >Derecha →</button>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        style={{ width: "100%", display: "block", maxWidth: "100%" }}
        className={selected ? "ring-2 ring-brand ring-offset-1" : ""}
        draggable={false}
      />
      {/* Resize handle */}
      {selected && (
        <div
          onMouseDown={handleMouseDown}
          title="Arrastrar para redimensionar"
          className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize bg-brand/80 hover:bg-brand"
          style={{ touchAction: "none" }}
        />
      )}
      {/* Width label */}
      {selected && node.attrs.width && (
        <span className="absolute bottom-0 left-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
          {node.attrs.width}
        </span>
      )}
    </NodeViewWrapper>
  );
}

// Block image node — floated left/right so sibling paragraphs wrap around it
const ResizableImage = Node.create({
  name: "image",
  group: "block",
  inline: false,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      float: {
        default: "none",
        parseHTML: (el) => (el as HTMLElement).style.float || "none",
        renderHTML: (attrs) =>
          attrs.float && attrs.float !== "none"
            ? { style: `float:${attrs.float};${attrs.width ? `width:${attrs.width};` : ""}` }
            : attrs.width
            ? { style: `width:${attrs.width};` }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
// ─────────────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        active
          ? "bg-brand text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-brand"
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-neutral-200" />;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage,
      Placeholder.configure({
        placeholder: placeholder ?? "Escribe el contenido aquí...",
      }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[320px] px-5 py-4 focus:outline-none text-neutral-800 overflow-hidden [&_h1]:font-playfair [&_h1]:text-2xl [&_h1]:text-brand [&_h2]:font-playfair [&_h2]:text-xl [&_h2]:text-brand [&_h3]:font-playfair [&_h3]:text-lg [&_h3]:text-brand [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-brand/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-neutral-600 [&_img]:max-w-full [&_img]:my-4 [&_hr]:border-neutral-200",
      },
    },
    immediatelyRender: false,
  });

  // Sync content when post changes (on edit open)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || "", false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL de la imagen:");
    if (url?.trim()) {
      editor.chain().focus().insertContent({ type: "image", attrs: { src: url.trim() } }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-neutral-300 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        {/* Undo / Redo */}
        <ToolbarButton
          title="Deshacer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Rehacer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          title="Título 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Título 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Título 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Text styles */}
        <ToolbarButton
          title="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Cursiva"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Subrayado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Tachado"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          title="Alinear izquierda"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Centrar"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Alinear derecha"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Justificar"
          active={editor.isActive({ textAlign: "justify" })}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          title="Lista con viñetas"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Extra */}
        <ToolbarButton
          title="Cita"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Línea divisoria"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Insertar imagen (por URL)"
          onClick={insertImage}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
