import { InsertBot } from "@shared/schema";

interface BotProfileTemplate {
  usernamePatterns: string[];
  bioTemplates: string[];
  favoritePairs: string[][];
  timezones: string[];
  firstNames: string[];
  lastNames: string[];
}

export class BotProfileService {
  private templates: BotProfileTemplate = {
    usernamePatterns: [
      "ScalpPro{num}",
      "TrendHunter{name}",
      "ForexKing{num}",
      "PipMaster{name}",
      "EATrader{num}",
      "SwingTrader{name}",
      "DayTrader{num}",
      "ChartWizard{name}",
      "TradingGuru{num}",
      "MarketShark{name}"
    ],
    bioTemplates: [
      "{years} years in forex, loving MT5 strategies",
      "Full-time trader focusing on {pair} and scalping",
      "EA enthusiast | {years}+ years experience",
      "Swing trader | Following trends on {pair}",
      "Day trader specializing in major pairs",
      "Automated trading expert with {years} years exp",
      "Professional trader | {pair} specialist",
      "Forex educator | MT4/MT5 strategies"
    ],
    favoritePairs: [
      ["EUR/USD", "GBP/USD"],
      ["XAU/USD", "EUR/USD"],
      ["USD/JPY", "GBP/JPY"],
      ["EUR/GBP", "USD/CHF"],
      ["AUD/USD", "NZD/USD"],
      ["EUR/JPY", "XAU/USD"]
    ],
    timezones: ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "America/Los_Angeles"],
    firstNames: ["Alex", "Sarah", "Mike", "Emma", "Jordan", "Casey", "Taylor", "Morgan", "Riley", "Sam"],
    lastNames: ["Thompson", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Anderson", "Taylor"]
  };

  generateUsername(): string {
    const pattern = this.templates.usernamePatterns[Math.floor(Math.random() * this.templates.usernamePatterns.length)];
    
    if (pattern.includes("{num}")) {
      const num = Math.floor(Math.random() * 999) + 1;
      return pattern.replace("{num}", num.toString());
    } else {
      const names = ["Max", "Alex", "Sam", "Jordan", "Casey", "Morgan", "Taylor", "Riley"];
      const name = names[Math.floor(Math.random() * names.length)];
      return pattern.replace("{name}", name);
    }
  }

  generateBio(): string {
    const template = this.templates.bioTemplates[Math.floor(Math.random() * this.templates.bioTemplates.length)];
    const years = Math.floor(Math.random() * 8) + 2; // 2-10 years
    const pair = this.templates.favoritePairs[Math.floor(Math.random() * this.templates.favoritePairs.length)][0];
    
    return template
      .replace("{years}", years.toString())
      .replace("{pair}", pair);
  }

  generateFavoritePairs(): string[] {
    return this.templates.favoritePairs[Math.floor(Math.random() * this.templates.favoritePairs.length)];
  }

  generateTimezone(): string {
    return this.templates.timezones[Math.floor(Math.random() * this.templates.timezones.length)];
  }

  generateJoinDate(): Date {
    // Random date within last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime);
  }

  generateTrustLevel(): number {
    // Random trust level between 2-5
    return Math.floor(Math.random() * 4) + 2;
  }

  generateProfilePictureUrl(): string {
    // Use placeholder service for trader photos
    const avatarId = Math.floor(Math.random() * 1000);
    return `https://i.pravatar.cc/150?img=${avatarId}`;
  }

  generateFirstName(): string {
    return this.templates.firstNames[Math.floor(Math.random() * this.templates.firstNames.length)];
  }

  generateLastName(): string {
    return this.templates.lastNames[Math.floor(Math.random() * this.templates.lastNames.length)];
  }

  createBotProfile(purpose: string, squad: string, aggressionLevel: number = 5): Partial<InsertBot> {
    const username = this.generateUsername();
    const firstName = this.generateFirstName();
    const lastName = this.generateLastName();
    
    return {
      username,
      firstName,
      lastName,
      email: `${username.toLowerCase()}@yoforex-bot.internal`,
      bio: this.generateBio(),
      profilePictureUrl: this.generateProfilePictureUrl(),
      purpose,
      squad,
      aggressionLevel,
      trustLevel: this.generateTrustLevel(),
      timezone: this.generateTimezone(),
      favoritePairs: this.generateFavoritePairs(),
      isActive: true,
      isBot: true
    };
  }
}

export const botProfileService = new BotProfileService();
