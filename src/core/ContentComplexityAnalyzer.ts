export class ContentComplexityAnalyzer {
  // Analyze content complexity based on various factors
  analyzeContentComplexity(items: any[]): number {
    if (items.length === 0) return 0.1; // Minimal complexity for empty
    
    let totalComplexity = 0;
    
    for (const item of items) {
      // Analyze different aspects of complexity
      const textComplexity = this.analyzeTextComplexity(item);
      const mediaComplexity = this.analyzeMediaComplexity(item);
      const componentComplexity = this.analyzeComponentComplexity(item);
      
      totalComplexity += (textComplexity + mediaComplexity + componentComplexity) / 3;
    }
    
    // Return average complexity normalized to 0-1 scale
    return Math.min(totalComplexity / items.length, 1);
  }
  
  private analyzeTextComplexity(item: any): number {
    let complexity = 0;
    
    // Length of text content
    if (typeof item.text === 'string') {
      complexity += Math.min(item.text.length / 1000, 0.5); // Max 0.5 for text
    }
    
    // Number of text elements
    if (Array.isArray(item.textElements)) {
      complexity += Math.min(item.textElements.length / 10, 0.3); // Max 0.3 for elements
    }
    
    // Formatting complexity
    if (item.hasRichText) complexity += 0.2;
    
    return Math.min(complexity, 1);
  }
  
  private analyzeMediaComplexity(item: any): number {
    let complexity = 0;
    
    // Number of media elements
    if (Array.isArray(item.media)) {
      complexity += Math.min(item.media.length * 0.2, 0.5);
    }
    
    // Media types (images, videos are more complex than icons)
    if (item.hasVideo) complexity += 0.3;
    if (item.hasImage) complexity += 0.15;
    if (item.hasSVG) complexity += 0.1;
    
    return Math.min(complexity, 1);
  }
  
  private analyzeComponentComplexity(item: any): number {
    let complexity = 0;
    
    // Number of nested components
    if (typeof item.componentDepth === 'number') {
      complexity += Math.min(item.componentDepth * 0.1, 0.4);
    }
    
    // Interactivity
    if (item.interactive) complexity += 0.2;
    if (item.hasAnimations) complexity += 0.2;
    if (item.hasState) complexity += 0.1;
    
    return Math.min(complexity, 1);
  }
  
  // Get complexity insights
  getComplexityInsights(items: any[]): {
    averageComplexity: number;
    textComplexity: number;
    mediaComplexity: number;
    componentComplexity: number;
  } {
    if (items.length === 0) {
      return {
        averageComplexity: 0.1,
        textComplexity: 0,
        mediaComplexity: 0,
        componentComplexity: 0
      };
    }
    
    let totalText = 0, totalMedia = 0, totalComponent = 0;
    
    for (const item of items) {
      totalText += this.analyzeTextComplexity(item);
      totalMedia += this.analyzeMediaComplexity(item);
      totalComponent += this.analyzeComponentComplexity(item);
    }
    
    return {
      averageComplexity: this.analyzeContentComplexity(items),
      textComplexity: totalText / items.length,
      mediaComplexity: totalMedia / items.length,
      componentComplexity: totalComponent / items.length
    };
  }
}