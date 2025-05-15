import React from 'react';

interface SectionHeaderProps {
  children: React.ReactNode;
  highlightedWord?: string;
  className?: string;
  size?: 'sm' | 'md' | 'base' | 'lg' | 'xl';
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  highlightedWord,
  className = '',
  size = 'lg',
}) => {
  // Define size variants
  const sizeVariants = {
    sm: 'text-2xl',
    md: 'text-3xl',
    base: 'text-4xl',
    lg: 'text-5xl',
    xl: 'text-6xl',
  };

  // If no highlightedWord is provided, render normally
  if (!highlightedWord) {
    return (
      <h2
        className={`font-bold capitalize ${sizeVariants[size]} ${className}`}>
        {children}
      </h2>
    );
  }

  // Split the children into an array of strings
  const childrenString =
    React.Children.map(children, (child) =>
      typeof child === 'string' ? child : ''
    )?.join('') || '';

  // Find the index of the highlighted word
  const highlightIndex = childrenString
    .toLowerCase()
    .indexOf(highlightedWord.toLowerCase());

  // If the word is not found, render normally
  if (highlightIndex === -1) {
    return (
      <h2 className={`font-bold ${sizeVariants[size]} ${className}`}>
        {children}
      </h2>
    );
  }

  // Split the text into before, highlighted, and after parts
  const beforeHighlight = childrenString.slice(0, highlightIndex);
  const afterHighlight = childrenString.slice(
    highlightIndex + highlightedWord.length
  );

  return (
    <h2
      className={`font-bold capitalize ${sizeVariants[size]} ${className}`}>
      {beforeHighlight}
      <span className="text-primary">
        {childrenString.slice(
          highlightIndex,
          highlightIndex + highlightedWord.length
        )}
      </span>
      {afterHighlight}
    </h2>
  );
};

export default SectionHeader;
