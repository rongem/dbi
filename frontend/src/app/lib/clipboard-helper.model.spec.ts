import { describe, expect, it } from 'vitest';

import { ClipboardHelper } from './clipboard-helper.model';

describe('ClipboardHelper', () => {
  it('parses HTML table content into rows and columns', () => {
    const data = {
      getData: (type: string) => type === 'text/html'
        ? '<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>'
        : '',
    } as DataTransfer;

    expect(ClipboardHelper.getTableContent(data)).toEqual([
      ['A', 'B'],
      ['1', '2'],
    ]);
  });

  it('rejects unsafe HTML content before parsing', () => {
    const data = {
      getData: (type: string) => type === 'text/html' ? '<script>alert(1)</script>' : '',
    } as DataTransfer;

    expect(() => ClipboardHelper.getTableContent(data)).toThrow(
      'Script content is forbidden due to prevention of XSS. Problematic tags found.'
    );
  });
});
