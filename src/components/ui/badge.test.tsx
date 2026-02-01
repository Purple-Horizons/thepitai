import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-800');
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-900/50');
  });

  it('applies tier styles for Champion', () => {
    render(<Badge variant="tier" tier="Champion">Champion</Badge>);
    const badge = screen.getByText('Champion');
    expect(badge).toHaveClass('bg-purple-900/50');
  });

  it('applies tier styles for Gold', () => {
    render(<Badge variant="tier" tier="Gold">Gold</Badge>);
    const badge = screen.getByText('Gold');
    expect(badge).toHaveClass('bg-yellow-900/50');
  });

  it('accepts custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });
});
