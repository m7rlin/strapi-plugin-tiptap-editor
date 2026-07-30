import React, { useState } from 'react';
import { CodeBlock } from '@tiptap/extension-code-block';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { Box, Flex, TextInput } from '@strapi/design-system';
import { useIntl } from 'react-intl';

/**
 * Code block with the renderer-side `filename` attribute (shared
 * CodeBlockAttrs in packages/shared) and an editable language field.
 * The web code-block component shows both in its header.
 */

const CodeBlockNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const { formatMessage } = useIntl();
  const language = typeof node.attrs.language === 'string' ? node.attrs.language : '';
  const filename = typeof node.attrs.filename === 'string' ? node.attrs.filename : '';
  const [languageDraft, setLanguageDraft] = useState(language);
  const [filenameDraft, setFilenameDraft] = useState(filename);

  return (
    <NodeViewWrapper>
      <Box
        background="neutral100"
        borderColor="neutral200"
        borderStyle="solid"
        borderWidth="1px"
        hasRadius
        marginTop={2}
        marginBottom={2}
      >
        {editor.isEditable && (
          <Flex gap={2} padding={2} contentEditable={false} borderColor="neutral200">
            <TextInput
              name="code-block-language"
              aria-label={formatMessage({
                id: 'tiptap-editor.codeBlock.language',
                defaultMessage: 'Language',
              })}
              placeholder={formatMessage({
                id: 'tiptap-editor.codeBlock.languagePlaceholder',
                defaultMessage: 'language (e.g. ts)',
              })}
              size="S"
              value={languageDraft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguageDraft(e.target.value)}
              onBlur={() => updateAttributes({ language: languageDraft.trim() || null })}
            />
            <TextInput
              name="code-block-filename"
              aria-label={formatMessage({
                id: 'tiptap-editor.codeBlock.filename',
                defaultMessage: 'Filename',
              })}
              placeholder={formatMessage({
                id: 'tiptap-editor.codeBlock.filenamePlaceholder',
                defaultMessage: 'filename (optional)',
              })}
              size="S"
              value={filenameDraft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilenameDraft(e.target.value)}
              onBlur={() => updateAttributes({ filename: filenameDraft.trim() || null })}
            />
          </Flex>
        )}
        <pre style={{ margin: 0, padding: '12px', overflowX: 'auto' }}>
          {/* NodeViewContent's prop types only admit 'div'; the runtime accepts
              any tag and a <code> child keeps the pre>code structure. */}
          <NodeViewContent as={'code' as unknown as 'div'} />
        </pre>
      </Box>
    </NodeViewWrapper>
  );
};

export const CodeBlockWithFilename = CodeBlock.extend({
  addAttributes() {
    const parent = this.parent ? this.parent() : {};
    return {
      ...parent,
      filename: { default: null },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
});
