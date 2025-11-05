import { db } from '../server/db';
import { contents } from '../shared/schema';

async function addSampleProducts() {
  const sampleProducts = [
    {
      title: 'Advanced Forex Trading Bot EA',
      slug: 'advanced-forex-trading-bot-ea-' + Date.now(),
      description: 'Professional automated trading system with advanced risk management and multi-currency support. Features intelligent entry/exit algorithms.',
      type: 'ea',
      category: 'Expert Advisor',
      priceCoins: 299,
      isFree: false,
      imageUrl: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&h=400&fit=crop',
      downloads: 1234,
      views: 5678,
      likes: 234,
      status: 'approved',
      authorId: 'sample-author-1'
    },
    {
      title: 'Trend Indicator Pro v2.0',
      slug: 'trend-indicator-pro-v2-' + Date.now(),
      description: 'Accurate trend detection indicator with multi-timeframe analysis and custom alerts. Works perfectly on all currency pairs.',
      type: 'indicator',
      category: 'Technical Indicator',
      priceCoins: 149,
      isFree: false,
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
      downloads: 2345,
      views: 8901,
      likes: 456,
      status: 'approved',
      authorId: 'sample-author-2'
    },
    {
      title: 'Scalping Strategy Template',
      slug: 'scalping-strategy-template-' + Date.now(),
      description: 'Complete scalping strategy template with entry/exit rules and money management system. Perfect for beginners and experts alike.',
      type: 'template',
      category: 'Trading Template',
      priceCoins: 0,
      isFree: true,
      imageUrl: 'https://images.unsplash.com/photo-1639389016237-85a1a16f76d0?w=600&h=400&fit=crop',
      downloads: 4567,
      views: 12345,
      likes: 789,
      status: 'approved',
      authorId: 'sample-author-3'
    },
    {
      title: 'Neural Network AI Trading Bot',
      slug: 'neural-network-ai-trading-bot-' + Date.now(),
      description: 'Cutting-edge AI-powered trading bot using deep learning for market prediction. Includes backtesting results and optimization tools.',
      type: 'ea',
      category: 'Expert Advisor',
      priceCoins: 599,
      isFree: false,
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop',
      downloads: 892,
      views: 4321,
      likes: 178,
      status: 'approved',
      authorId: 'sample-author-4'
    },
    {
      title: 'RSI Divergence Scanner',
      slug: 'rsi-divergence-scanner-' + Date.now(),
      description: 'Advanced RSI divergence scanner that identifies hidden and regular divergences across multiple timeframes.',
      type: 'indicator',
      category: 'Technical Indicator',
      priceCoins: 89,
      isFree: false,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      downloads: 3456,
      views: 7890,
      likes: 567,
      status: 'approved',
      authorId: 'sample-author-5'
    },
    {
      title: 'Price Action Strategy Guide',
      slug: 'price-action-strategy-guide-' + Date.now(),
      description: 'Comprehensive guide to price action trading with real-world examples and trading setups.',
      type: 'article',
      category: 'Educational Content',
      priceCoins: 0,
      isFree: true,
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
      downloads: 8901,
      views: 23456,
      likes: 1234,
      status: 'approved',
      authorId: 'sample-author-6'
    }
  ];

  try {
    for (const product of sampleProducts) {
      await db.insert(contents).values(product).onConflictDoNothing();
    }
    
    console.log(`✅ Successfully added ${sampleProducts.length} sample products!`);
    
    // Verify products were added
    const allContent = await db.select().from(contents);
    console.log(`Total products in marketplace: ${allContent.length}`);
  } catch (error) {
    console.error('Error adding sample products:', error);
  }
  
  process.exit(0);
}

addSampleProducts().catch(console.error);