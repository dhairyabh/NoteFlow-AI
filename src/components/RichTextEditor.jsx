import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Highlighter, Palette,
  Heading1, Heading2, Heading3, Minus, RotateCcw,
  ChevronDown, Type, Pilcrow
} from 'lucide-react';

// Custom FontSize extension (inline style approach)
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: el => el.style.fontSize || null,
            renderHTML: attrs => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72'];

const TEXT_COLORS = [
  '#ffffff', '#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6',
  '#000000', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777',
  '#64748b', '#475569', '#334155', '#1e293b',
];

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#f5f5f5',
];

const ToolbarButton = ({ onClick, active, title, children, className = '' }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`
      w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-150
      ${active
        ? 'bg-primary text-white shadow-md shadow-primary/30'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
      } ${className}
    `}
  >
    {children}
  </button>
);

const Separator = () => (
  <div className="w-px h-7 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
);

const RichTextEditor = ({ content, onChange }) => {
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const colorBtnRef = useRef(null);
  const highlightBtnRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontFamily,
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[500px] max-w-none prose prose-slate dark:prose-invert prose-lg focus:outline-none leading-relaxed',
      },
    },
  });

  const setFontFamily = (font) => {
    editor.chain().focus().setFontFamily(font).run();
  };

  const setFontSize = (size) => {
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  const setTextColor = (color) => {
    editor.chain().focus().setColor(color).run();
    setShowTextColor(false);
  };

  const setHighlightColor = (color) => {
    editor.chain().focus().toggleHighlight({ color }).run();
    setShowHighlight(false);
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-[2rem] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">

        {/* Font Family */}
        <select
          title="Font Family"
          onChange={(e) => setFontFamily(e.target.value)}
          defaultValue=""
          className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border-none outline-none hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer max-w-[140px]"
        >
          <option value="" disabled>Font</option>
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
          ))}
        </select>

        {/* Font Size */}
        <select
          title="Font Size"
          onChange={(e) => setFontSize(e.target.value)}
          defaultValue=""
          className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border-none outline-none hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer w-20"
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <Separator />

        {/* Headings */}
        <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')}>
          <Pilcrow size={16} />
        </ToolbarButton>

        <Separator />

        {/* Formatting */}
        <ToolbarButton title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
          <Strikethrough size={16} />
        </ToolbarButton>

        <Separator />

        {/* Text Color */}
        <div className="relative" ref={colorBtnRef}>
          <button
            type="button"
            title="Text Color"
            onMouseDown={(e) => { e.preventDefault(); setShowTextColor(v => !v); setShowHighlight(false); }}
            className="w-9 h-9 flex flex-col items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <Type size={14} />
            <div className="w-5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#7c3aed' }} />
          </button>
          {showTextColor && (
            <div className="absolute top-12 right-0 z-50 p-4 glass-card rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 min-w-[220px]">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Text Color</p>
              <div className="grid grid-cols-10 gap-1.5">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setTextColor(c); }}
                    className="w-4 h-4 rounded-md border border-white/20 hover:scale-125 transition-transform shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowTextColor(false); }}
                className="mt-3 text-[10px] font-bold text-slate-400 hover:text-primary w-full text-center block"
              >Remove color</button>
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative" ref={highlightBtnRef}>
          <button
            type="button"
            title="Highlight"
            onMouseDown={(e) => { e.preventDefault(); setShowHighlight(v => !v); setShowTextColor(false); }}
            className={`w-9 h-9 flex flex-col items-center justify-center rounded-xl transition-all ${editor.isActive('highlight') ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Highlighter size={14} />
          </button>
          {showHighlight && (
            <div className="absolute top-12 left-0 z-50 p-3 glass-card rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Highlight Color</p>
              <div className="flex gap-2">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setHighlightColor(c); }}
                    className="w-6 h-6 rounded-lg border border-slate-200 hover:scale-125 transition-transform shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlight(false); }}
                className="mt-2 text-[10px] font-bold text-slate-400 hover:text-primary w-full text-center"
              >Remove highlight</button>
            </div>
          )}
        </div>

        <Separator />

        {/* Text Alignment */}
        <ToolbarButton title="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}>
          <AlignJustify size={16} />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
          <ListOrdered size={16} />
        </ToolbarButton>

        <Separator />

        {/* Divider & Clear */}
        <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false}>
          <Minus size={16} />
        </ToolbarButton>
        <ToolbarButton title="Clear All Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} active={false}>
          <RotateCcw size={16} />
        </ToolbarButton>
      </div>

      {/* ── Editor Body ── */}
      <div
        className="px-10 py-8 text-slate-800 dark:text-slate-100"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
