import React, { useState } from 'react';
import { Editor, Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { Box, Flex, IconButton, SingleSelect, SingleSelectOption, TextInput } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

/**
 * Call-to-action button block. Node name/attrs mirror the web renderer's
 * CtaButton (apps/web/app/tiptap/custom-nodes.ts) — schema-affecting changes
 * must be made on both sides.
 */

export const CTA_BUTTON_NODE_NAME = 'ctaButton';
export const CTA_VARIANTS = ['primary', 'outline'] as const;

const CtaButtonNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
}) => {
  const { formatMessage } = useIntl();
  const label = typeof node.attrs.label === 'string' ? node.attrs.label : '';
  const href = typeof node.attrs.href === 'string' ? node.attrs.href : '';
  const rawVariant = typeof node.attrs.variant === 'string' ? node.attrs.variant : 'primary';
  const variant = (CTA_VARIANTS as readonly string[]).includes(rawVariant) ? rawVariant : 'primary';
  const [labelDraft, setLabelDraft] = useState(label);
  const [hrefDraft, setHrefDraft] = useState(href);

  const preview = (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: '6px',
        fontWeight: 600,
        background: variant === 'primary' ? '#4945ff' : 'transparent',
        color: variant === 'primary' ? '#ffffff' : '#4945ff',
        border: '1px solid #4945ff',
      }}
    >
      {label || '…'}
    </span>
  );

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
        <Box marginBottom={editor.isEditable ? 2 : 0}>{preview}</Box>
        {editor.isEditable && (
          <Flex gap={2} alignItems="flex-end" wrap="wrap">
            <Box flex="1">
              <TextInput
                name="cta-label"
                aria-label={formatMessage({ id: 'tiptap-editor.cta.label', defaultMessage: 'Label' })}
                placeholder={formatMessage({ id: 'tiptap-editor.cta.label', defaultMessage: 'Label' })}
                size="S"
                value={labelDraft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelDraft(e.target.value)}
                onBlur={() => updateAttributes({ label: labelDraft.trim() })}
              />
            </Box>
            <Box flex="1">
              <TextInput
                name="cta-href"
                aria-label={formatMessage({ id: 'tiptap-editor.cta.href', defaultMessage: 'Link' })}
                placeholder="https://… or /path"
                size="S"
                value={hrefDraft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHrefDraft(e.target.value)}
                onBlur={() => updateAttributes({ href: hrefDraft.trim() })}
              />
            </Box>
            <SingleSelect
              size="S"
              aria-label={formatMessage({ id: 'tiptap-editor.cta.variant', defaultMessage: 'Style' })}
              value={variant}
              onChange={(value: string | number) => updateAttributes({ variant: String(value) })}
            >
              {CTA_VARIANTS.map((entry) => (
                <SingleSelectOption key={entry} value={entry}>
                  {entry}
                </SingleSelectOption>
              ))}
            </SingleSelect>
            <IconButton
              label={formatMessage({ id: 'tiptap-editor.cta.remove', defaultMessage: 'Remove button' })}
              onClick={() => deleteNode()}
            >
              <Trash />
            </IconButton>
          </Flex>
        )}
      </Box>
    </NodeViewWrapper>
  );
};

export const CtaButton = Node.create({
  name: CTA_BUTTON_NODE_NAME,
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      label: { default: '' },
      href: { default: '#' },
      variant: { default: 'primary' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-cta-button]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-cta-button': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CtaButtonNodeView);
  },
});

export function useCtaButton(editor: Editor | null, props: { disabled?: boolean } = {}) {
  const { formatMessage } = useIntl();

  const insert = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: CTA_BUTTON_NODE_NAME,
        attrs: { label: '', href: '#', variant: 'primary' },
      })
      .createParagraphNear()
      .run();
  };

  return {
    ctaButton: (
      <ToolbarButton
        onClick={insert}
        icon={<span style={{ fontSize: '11px', fontWeight: 700 }}>CTA</span>}
        disabled={props.disabled || !editor}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.ctaButton',
          defaultMessage: 'Insert CTA button',
        })}
      />
    ),
  };
}
