import { useRef } from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditorType } from 'tinymce';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Editor({ value, onChange, placeholder }: EditorProps) {
  const editorRef = useRef<{ editor: TinyMCEEditorType } | null>(null);

  return (
    <TinyMCEEditor
      apiKey="brqhxn9ngqho1xfa1ogjyy7ysadh6oymh0tfyi1ccp1mu9q3"
      onInit={(_, editor) => {
        editorRef.current = { editor };
      }}
      value={value}
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height: 500,
        menubar: true,
        skin: "oxide",
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount',
          'save', 'directionality', 'emoticons'
        ],
        toolbar: 'undo redo | blocks | formatselect | ' +
          'bold italic forecolor backcolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; 
            font-size: 14px; 
            line-height: 1.6;
            padding: 1rem;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            font-weight: 600;
          }
          p { margin: 1rem 0; }
          table { border-collapse: collapse; }
          table td, table th { border: 1px solid #ddd; padding: 8px; }
        `,
        placeholder: placeholder,
        branding: false,
        promotion: false,
        entity_encoding: 'raw',
        forced_root_block: 'p',
        remove_trailing_brs: true,
        convert_urls: false,
        formats: {
          p: { block: 'p' },
          h1: { block: 'h1' },
          h2: { block: 'h2' },
          h3: { block: 'h3' },
          h4: { block: 'h4' },
          h5: { block: 'h5' },
          h6: { block: 'h6' }
        }
      }}
      className="min-h-[500px] border rounded-md"
    />
  );
} 