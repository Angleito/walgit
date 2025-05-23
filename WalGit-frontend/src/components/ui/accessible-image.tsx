'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface AccessibleImageProps extends Omit<ImageProps, 'alt'> {
  /**
   * Alternative text for the image. Required for all images unless decorative.
   * If the image is decorative, set alt to an empty string and decorative to true.
   */
  alt: string;
  
  /**
   * Indicates that the image is decorative and should be hidden from screen readers
   */
  decorative?: boolean;
  
  /**
   * Optional longer description of the image for complex images
   */
  longDescription?: string;

  /**
   * ID for the long description element
   */
  longDescriptionId?: string;
  
  /**
   * Optional caption to display below the image
   */
  caption?: string;
  
  /**
   * Optional className for the container element
   */
  containerClassName?: string;
  
  /**
   * Optional className for the figure element
   */
  figureClassName?: string;
  
  /**
   * Optional className for the caption element
   */
  captionClassName?: string;
}

/**
 * AccessibleImage component that wraps Next.js Image with proper accessibility attributes
 */
export function AccessibleImage({
  alt,
  decorative = false,
  longDescription,
  longDescriptionId,
  caption,
  containerClassName,
  figureClassName,
  captionClassName,
  ...props
}: AccessibleImageProps) {
  // Generate an ID for the description if one is provided but no ID
  const descId = longDescription && !longDescriptionId 
    ? `img-desc-${Math.random().toString(36).substring(2, 9)}`
    : longDescriptionId;

  const imgElement = (
    <Image
      alt={alt}
      aria-hidden={decorative}
      {...(longDescription && descId ? { 'aria-describedby': descId } : {})}
      {...props}
    />
  );

  // If no caption or long description, just return the image
  if (!caption && !longDescription) {
    return (
      <div className={containerClassName}>
        {imgElement}
      </div>
    );
  }

  // Use a figure element for images with captions
  return (
    <div className={containerClassName}>
      <figure className={cn("relative", figureClassName)}>
        {imgElement}
        
        {caption && (
          <figcaption 
            className={cn(
              "text-sm text-gray-500 mt-2 text-center",
              captionClassName
            )}
          >
            {caption}
          </figcaption>
        )}
        
        {longDescription && descId && (
          <div 
            id={descId} 
            className="sr-only"
          >
            {longDescription}
          </div>
        )}
      </figure>
    </div>
  );
}