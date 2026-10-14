import styled from "styled-components";

export const ProductPicker = styled.div`
  .picker-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px;
    margin-bottom: 18px;
    border: 1px solid var(--card-border-color);
    border-radius: 10px;
    cursor: pointer;
  }
  .picker-toggle strong {
    display: block;
    font-size: 13px;
  }
  .picker-toggle small {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: var(--card-muted-fg-color);
  }
  .picker-toggle input {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    accent-color: var(--picker-accent);
  }
  .picker-option:disabled {
    opacity: 0.7;
  }
  .picker-product .picker-unavailable {
    color: var(--card-fg-color);
    font-weight: 600;
  }
  --picker-accent: var(--card-focus-ring-color, #748bff);
  color: var(--card-fg-color);
  font: inherit;
  * {
    box-sizing: border-box;
  }
  button,
  input {
    font: inherit;
    color: inherit;
  }
  button {
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  :is(input, button):focus-visible {
    outline: 2px solid var(--picker-accent);
    outline-offset: 3px;
  }
  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }
  .picker-header h3 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 650;
  }
  .picker-caption {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--card-muted-fg-color);
  }
  .picker-badge {
    flex-shrink: 0;
    padding: 5px 9px;
    border: 1px solid var(--card-border-color);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }
  .picker-search {
    position: relative;
    display: flex;
    align-items: center;
  }
  .picker-search > svg {
    position: absolute;
    left: 14px;
    width: 22px;
    height: 22px;
    color: var(--card-muted-fg-color);
    pointer-events: none;
  }
  .picker-search input {
    width: 100%;
    padding: 14px 68px 14px 44px;
    border: 1px solid var(--card-border-color);
    border-radius: 10px;
    background: var(--card-bg-color);
    font-size: 14px;
    appearance: none;
  }
  .picker-search input::-webkit-search-cancel-button {
    display: none;
  }
  .picker-search input::placeholder {
    color: var(--card-muted-fg-color);
  }
  .picker-clear {
    position: absolute;
    right: 12px;
    padding: 5px;
    border: 0;
    background: transparent;
    font-size: 12px;
    color: var(--card-muted-fg-color);
  }
  .picker-selected {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 18px;
    padding: 14px;
    border: 1px solid var(--picker-accent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--picker-accent) 9%, var(--card-bg-color));
  }
  .picker-selected > svg {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    color: var(--picker-accent);
  }
  .picker-selected small {
    display: block;
    margin-bottom: 5px;
    color: var(--card-muted-fg-color);
    font-size: 11px;
  }
  .picker-selected strong {
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .picker-meta {
    display: flex;
    justify-content: space-between;
    margin: 18px 0 10px;
    font-size: 11px;
    font-weight: 600;
    color: var(--card-muted-fg-color);
  }
  .picker-list {
    display: grid;
    gap: 8px;
    max-height: 360px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 3px;
    scrollbar-width: thin;
  }
  .picker-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px;
    text-align: left;
    border: 1px solid var(--card-border-color);
    border-radius: 10px;
    background: var(--card-bg-color);
    transition:
      border-color 120ms ease,
      background 120ms ease;
  }
  .picker-option:hover:not(:disabled) {
    border-color: var(--picker-accent);
    background: color-mix(in srgb, var(--picker-accent) 5%, var(--card-bg-color));
  }
  .picker-option[aria-pressed="true"] {
    border-color: var(--picker-accent);
    background: color-mix(in srgb, var(--picker-accent) 10%, var(--card-bg-color));
  }
  .picker-marker {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border: 1px solid var(--card-border-color);
    border-radius: 50%;
  }
  [aria-pressed="true"] .picker-marker {
    border-color: var(--picker-accent);
    background: var(--picker-accent);
    color: #fff;
  }
  .picker-marker svg {
    width: 18px;
    height: 18px;
  }
  .picker-product {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  .picker-product strong {
    font-size: 13px;
    line-height: 1.5;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .picker-product small {
    font-size: 11px;
    line-height: 1.4;
    color: var(--card-muted-fg-color);
    overflow-wrap: anywhere;
  }
  .picker-state {
    display: grid;
    justify-items: center;
    gap: 8px;
    min-height: 180px;
    align-content: center;
    padding: 24px;
    text-align: center;
    border: 1px dashed var(--card-border-color);
    border-radius: 10px;
  }
  .picker-state p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
  }
  .picker-state > svg {
    width: 28px;
    height: 28px;
    color: var(--card-muted-fg-color);
  }
  .picker-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--card-border-color);
  }
  .picker-pagination span {
    font-size: 12px;
    color: var(--card-muted-fg-color);
  }
  .picker-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid var(--card-border-color);
    border-radius: 8px;
    background: var(--card-bg-color);
    font-size: 12px;
    font-weight: 600;
  }
  .picker-button:hover:not(:disabled) {
    border-color: var(--picker-accent);
  }
  .picker-button svg {
    width: 18px;
    height: 18px;
  }
  @media (max-width: 400px) {
    .picker-badge {
      display: none;
    }
    .picker-option {
      padding: 11px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .picker-option {
      transition: none;
    }
  }
`;
