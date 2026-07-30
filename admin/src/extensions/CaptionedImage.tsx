import React, { useState } from 'react';
import { Editor, Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { Box, Flex, IconButton, TextInput } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';
import { MediaLibraryWrapper, StrapiFile } from '../components/MediaLibraryWrapper';

/**
 * Figure with caption, inserted from the Media Library. Node name/attrs mirror
 * the web renderer's CaptionedImage (apps/web/app/tiptap/custom-nodes.ts) —
 * schema-affecting changes must be made on both sides.
 */

export const CAPTIONED_IMAGE_NODE_NAME = 'captionedImage';

const CaptionedImageNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
}) => {
  const { formatMessage } = useIntl();
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';
  const caption = typeof node.attrs.caption === 'string' ? node.attrs.caption : '';
  const [captionDraft, setCaptionDraft] = useState(caption);

  return (
    <NodeViewWrapper>
      <Box
        borderColor="neutral200"
        borderStyle="solid"
        borderWidth="1px"
        hasRadius
        padding={2}
        marginTop={2}
        marginBottom={2}
        style={{ maxWidth: '480px' }}
        contentEditable={false}
      >
        <img
          src={src}
          alt={alt}
          style={{ display: 'block', maxWidth: '100%', borderRadius: '4px' }}
          draggable={false}
        />
        {editor.isEditable ? (
          <Flex marginTop={2} gap={2} alignItems="center">
            <Box flex="1">
              <TextInput
                name="captioned-image-caption"
                aria-label={formatMessage({
                  id: 'tiptap-editor.captionedImage.caption',
                  defaultMessage: 'Caption',
                })}
                placeholder={formatMessage({
                  id: 'tiptap-editor.captionedImage.captionPlaceholder',
                  defaultMessage: 'Caption…',
                })}
                size="S"
                value={captionDraft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaptionDraft(e.target.value)}
                onBlur={() => updateAttributes({ caption: captionDraft.trim() || null })}
              />
            </Box>
            <IconButton
              label={formatMessage({
                id: 'tiptap-editor.captionedImage.remove',
                defaultMessage: 'Remove image',
              })}
              onClick={() => deleteNode()}
            >
              <Trash />
            </IconButton>
          </Flex>
        ) : (
          caption && (
            <Box marginTop={1} style={{ textAlign: 'center', fontSize: '12px' }}>
              {caption}
            </Box>
          )
        )}
      </Box>
    </NodeViewWrapper>
  );
};

export const CaptionedImage = Node.create({
  name: CAPTIONED_IMAGE_NODE_NAME,
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      caption: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-captioned-image]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-captioned-image': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CaptionedImageNodeView);
  },
});

const CaptionedImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="m6.5 12 3-3.5 3 3 2-2 3 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function useCaptionedImage(editor: Editor | null, props: { disabled?: boolean } = {}) {
  const { formatMessage } = useIntl();
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectAssets = (assets: StrapiFile[]) => {
    setShowPicker(false);
    if (!editor) return;
    const asset = assets[0];
    const src = asset?.url?.trim();
    if (!asset || !src) return;
    const altText = asset.alternativeText ?? asset.name ?? '';
    editor
      .chain()
      .focus()
      .insertContent({
        type: CAPTIONED_IMAGE_NODE_NAME,
        attrs: { src, alt: altText, caption: null },
      })
      .createParagraphNear()
      .run();
  };

  return {
    captionedImageButton: (
      <ToolbarButton
        onClick={() => setShowPicker(true)}
        icon={<CaptionedImageIcon />}
        disabled={props.disabled || !editor}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.captionedImage',
          defaultMessage: 'Insert captioned image',
        })}
      />
    ),
    captionedImageDialog: showPicker ? (
      <MediaLibraryWrapper
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectAssets={handleSelectAssets}
      />
    ) : null,
  };
}
