"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, TrendingDown, DollarSign, Info, RefreshCw, AlertCircle, ArrowUpDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CURRENCY_PAIRS = [
  { value: 'EUR/USD', label: 'EUR/USD', pipSize: 0.0001, base: 'EUR', quote: 'USD' },
  { value: 'GBP/USD', label: 'GBP/USD', pipSize: 0.0001, base: 'GBP', quote: 'USD' },
  { value: 'USD/JPY', label: 'USD/JPY', pipSize: 0.01, base: 'USD', quote: 'JPY' },
  { value: 'USD/CHF', label: 'USD/CHF', pipSize: 0.0001, base: 'USD', quote: 'CHF' },
  { value: 'AUD/USD', label: 'AUD/USD', pipSize: 0.0001, base: 'AUD', quote: 'USD' },
  { value: 'USD/CAD', label: 'USD/CAD', pipSize: 0.0001, base: 'USD', quote: 'CAD' },
  { value: 'NZD/USD', label: 'NZD/USD', pipSize: 0.0001, base: 'NZD', quote: 'USD' },
];

const ACCOUNT_CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
];

const pipCalculatorSchema = z.object({
  currencyPair: z.string().min(1, 'Select a currency pair'),
  accountCurrency: z.string().min(1, 'Select account currency'),
  tradeDirection: z.enum(['buy', 'sell']),
  positionSize: z.number().min(0.01, 'Minimum 0.01 lots').max(100, 'Maximum 100 lots'),
  entryPrice: z.number().positive('Entry price must be positive'),
  exitPrice: z.number().positive('Exit price must be positive').optional().or(z.literal(0)),
  stopLoss: z.number().positive('Stop loss must be positive').optional().or(z.literal(0)),
  takeProfit: z.number().positive('Take profit must be positive').optional().or(z.literal(0)),
});

type PipCalculatorForm = z.infer<typeof pipCalculatorSchema>;

interface CalculationResults {
  pipValue: number;
  pips: number;
  profitLoss: number;
  riskRewardRatio: number | null;
  riskAmount: number | null;
  rewardAmount: number | null;
}

export default function PipCalculatorPage() {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [autoCalculate, setAutoCalculate] = useState(true);

  const form = useForm<PipCalculatorForm>({
    resolver: zodResolver(pipCalculatorSchema),
    defaultValues: {
      currencyPair: 'EUR/USD',
      accountCurrency: 'USD',
      tradeDirection: 'buy',
      positionSize: 1.0,
      entryPrice: 0,
      exitPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
    },
    mode: 'onChange',
  });

  const watchAllFields = form.watch();

  const calculatePipValue = (pair: string, accountCurrency: string, positionSize: number): number => {
    const currencyPair = CURRENCY_PAIRS.find(p => p.value === pair);
    if (!currencyPair) return 0;

    const CONTRACT_SIZE = 100000;
    const pipSize = currencyPair.pipSize;
    
    // For pairs where quote currency is USD and account is USD
    if (currencyPair.quote === 'USD' && accountCurrency === 'USD') {
      return (pipSize * CONTRACT_SIZE * positionSize);
    }
    
    // For JPY pairs
    if (currencyPair.quote === 'JPY' && accountCurrency === 'USD') {
      // Simplified: using approximate conversion rate
      const approximateUsdJpy = 110; // This would ideally come from live rates
      return (pipSize * CONTRACT_SIZE * positionSize) / approximateUsdJpy;
    }
    
    // For other pairs, simplified calculation
    return (pipSize * CONTRACT_SIZE * positionSize);
  };

  const calculatePips = (pair: string, entryPrice: number, exitPrice: number, direction: 'buy' | 'sell'): number => {
    const currencyPair = CURRENCY_PAIRS.find(p => p.value === pair);
    if (!currencyPair || !entryPrice || !exitPrice) return 0;

    const pipSize = currencyPair.pipSize;
    let priceDifference = 0;

    if (direction === 'buy') {
      priceDifference = exitPrice - entryPrice;
    } else {
      priceDifference = entryPrice - exitPrice;
    }

    return priceDifference / pipSize;
  };

  const calculateResults = (data: PipCalculatorForm): CalculationResults => {
    const pipValue = calculatePipValue(data.currencyPair, data.accountCurrency, data.positionSize);
    
    let pips = 0;
    let profitLoss = 0;
    
    if (data.exitPrice && data.exitPrice > 0) {
      pips = calculatePips(data.currencyPair, data.entryPrice, data.exitPrice, data.tradeDirection);
      profitLoss = pips * pipValue;
    }

    let riskRewardRatio: number | null = null;
    let riskAmount: number | null = null;
    let rewardAmount: number | null = null;

    if (data.stopLoss && data.stopLoss > 0 && data.takeProfit && data.takeProfit > 0) {
      const riskPips = Math.abs(calculatePips(data.currencyPair, data.entryPrice, data.stopLoss, data.tradeDirection));
      const rewardPips = Math.abs(calculatePips(data.currencyPair, data.entryPrice, data.takeProfit, data.tradeDirection));
      
      riskAmount = riskPips * pipValue;
      rewardAmount = rewardPips * pipValue;
      
      if (riskPips > 0) {
        riskRewardRatio = rewardPips / riskPips;
      }
    }

    return {
      pipValue,
      pips,
      profitLoss,
      riskRewardRatio,
      riskAmount,
      rewardAmount,
    };
  };

  useEffect(() => {
    if (autoCalculate && form.formState.isValid) {
      const data = form.getValues();
      const calculatedResults = calculateResults(data);
      setResults(calculatedResults);
    }
  }, [watchAllFields, autoCalculate, form]);

  const onSubmit = (data: PipCalculatorForm) => {
    const calculatedResults = calculateResults(data);
    setResults(calculatedResults);
  };

  const handleReset = () => {
    form.reset({
      currencyPair: 'EUR/USD',
      accountCurrency: 'USD',
      tradeDirection: 'buy',
      positionSize: 1.0,
      entryPrice: 0,
      exitPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
    });
    setResults(null);
  };

  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" data-testid="heading-pip-calculator">
                  Forex Pip Calculator
                </h1>
                <p className="text-muted-foreground mt-1">
                  Calculate pip value, profit/loss, and risk/reward ratio for your forex trades
                </p>
              </div>
            </div>
          </div>

          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Trade Parameters
              </CardTitle>
              <CardDescription>
                Enter your trade details to calculate pip value and potential profit/loss
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Currency Pair */}
                  <div className="space-y-2">
                    <Label htmlFor="currencyPair" className="flex items-center gap-2">
                      Currency Pair
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the forex pair you want to trade</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      value={form.watch('currencyPair')}
                      onValueChange={(value) => form.setValue('currencyPair', value, { shouldValidate: true })}
                    >
                      <SelectTrigger data-testid="select-currency-pair">
                        <SelectValue placeholder="Select pair" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_PAIRS.map((pair) => (
                          <SelectItem key={pair.value} value={pair.value}>
                            {pair.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.currencyPair && (
                      <p className="text-sm text-destructive">{form.formState.errors.currencyPair.message}</p>
                    )}
                  </div>

                  {/* Account Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="accountCurrency" className="flex items-center gap-2">
                      Account Currency
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The currency denomination of your trading account</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      value={form.watch('accountCurrency')}
                      onValueChange={(value) => form.setValue('accountCurrency', value, { shouldValidate: true })}
                    >
                      <SelectTrigger data-testid="select-account-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.accountCurrency && (
                      <p className="text-sm text-destructive">{form.formState.errors.accountCurrency.message}</p>
                    )}
                  </div>

                  {/* Trade Direction */}
                  <div className="space-y-2">
                    <Label htmlFor="tradeDirection" className="flex items-center gap-2">
                      Trade Direction
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Buy (long) or Sell (short) position</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      value={form.watch('tradeDirection')}
                      onValueChange={(value: 'buy' | 'sell') => form.setValue('tradeDirection', value, { shouldValidate: true })}
                    >
                      <SelectTrigger data-testid="select-trade-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Buy (Long)
                          </div>
                        </SelectItem>
                        <SelectItem value="sell">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            Sell (Short)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Position Size */}
                  <div className="space-y-2">
                    <Label htmlFor="positionSize" className="flex items-center gap-2">
                      Position Size (Lots)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Trade size in lots (1 lot = 100,000 units)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.0"
                      {...form.register('positionSize', { valueAsNumber: true })}
                      data-testid="input-position-size"
                    />
                    {form.formState.errors.positionSize && (
                      <p className="text-sm text-destructive">{form.formState.errors.positionSize.message}</p>
                    )}
                  </div>

                  {/* Entry Price */}
                  <div className="space-y-2">
                    <Label htmlFor="entryPrice" className="flex items-center gap-2">
                      Entry Price
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The price at which you enter the trade</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="1.1000"
                      {...form.register('entryPrice', { valueAsNumber: true })}
                      data-testid="input-entry-price"
                    />
                    {form.formState.errors.entryPrice && (
                      <p className="text-sm text-destructive">{form.formState.errors.entryPrice.message}</p>
                    )}
                  </div>

                  {/* Exit Price */}
                  <div className="space-y-2">
                    <Label htmlFor="exitPrice" className="flex items-center gap-2">
                      Exit Price <span className="text-muted-foreground text-xs">(Optional)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Target exit price for profit/loss calculation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="1.1050"
                      {...form.register('exitPrice', { valueAsNumber: true })}
                      data-testid="input-exit-price"
                    />
                    {form.formState.errors.exitPrice && (
                      <p className="text-sm text-destructive">{form.formState.errors.exitPrice.message}</p>
                    )}
                  </div>

                  {/* Stop Loss */}
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss" className="flex items-center gap-2">
                      Stop Loss <span className="text-muted-foreground text-xs">(Optional)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Price level to limit losses</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="1.0950"
                      {...form.register('stopLoss', { valueAsNumber: true })}
                      data-testid="input-stop-loss"
                    />
                    {form.formState.errors.stopLoss && (
                      <p className="text-sm text-destructive">{form.formState.errors.stopLoss.message}</p>
                    )}
                  </div>

                  {/* Take Profit */}
                  <div className="space-y-2">
                    <Label htmlFor="takeProfit" className="flex items-center gap-2">
                      Take Profit <span className="text-muted-foreground text-xs">(Optional)</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Price level to take profits</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      type="number"
                      step="0.00001"
                      placeholder="1.1100"
                      {...form.register('takeProfit', { valueAsNumber: true })}
                      data-testid="input-take-profit"
                    />
                    {form.formState.errors.takeProfit && (
                      <p className="text-sm text-destructive">{form.formState.errors.takeProfit.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" className="flex items-center gap-2" data-testid="button-calculate">
                    <Calculator className="h-4 w-4" />
                    Calculate
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} className="flex items-center gap-2" data-testid="button-reset">
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results Display */}
          {results && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-primary" />
                  Calculation Results
                </CardTitle>
                <CardDescription>
                  Based on your trade parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Pip Value */}
                  <div className="p-4 rounded-lg bg-card border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Pip Value</p>
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold" data-testid="result-pip-value">
                      {formatCurrency(results.pipValue, form.watch('accountCurrency'))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">per pip</p>
                  </div>

                  {/* Number of Pips */}
                  {results.pips !== 0 && (
                    <div className="p-4 rounded-lg bg-card border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Number of Pips</p>
                        <ArrowUpDown className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold" data-testid="result-pips">
                        {results.pips.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {results.pips > 0 ? 'profit' : 'loss'}
                      </p>
                    </div>
                  )}

                  {/* Profit/Loss */}
                  {results.profitLoss !== 0 && (
                    <div className={`p-4 rounded-lg border ${results.profitLoss >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Profit/Loss</p>
                        {results.profitLoss >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <p className={`text-2xl font-bold ${results.profitLoss >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`} data-testid="result-profit-loss">
                        {formatCurrency(results.profitLoss, form.watch('accountCurrency'))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {results.profitLoss >= 0 ? 'potential profit' : 'potential loss'}
                      </p>
                    </div>
                  )}

                  {/* Risk Amount */}
                  {results.riskAmount !== null && (
                    <div className="p-4 rounded-lg bg-card border border-red-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Risk Amount</p>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {formatCurrency(Math.abs(results.riskAmount), form.watch('accountCurrency'))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">at stop loss</p>
                    </div>
                  )}

                  {/* Reward Amount */}
                  {results.rewardAmount !== null && (
                    <div className="p-4 rounded-lg bg-card border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Reward Amount</p>
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {formatCurrency(results.rewardAmount, form.watch('accountCurrency'))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">at take profit</p>
                    </div>
                  )}

                  {/* Risk/Reward Ratio */}
                  {results.riskRewardRatio !== null && (
                    <div className="p-4 rounded-lg bg-card border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Risk/Reward Ratio</p>
                        <Badge variant={results.riskRewardRatio >= 2 ? 'default' : results.riskRewardRatio >= 1 ? 'secondary' : 'destructive'}>
                          {results.riskRewardRatio >= 2 ? 'Excellent' : results.riskRewardRatio >= 1 ? 'Good' : 'Poor'}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold" data-testid="result-risk-reward">
                        1:{results.riskRewardRatio.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">reward per risk</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How to Use Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                How to Use This Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">📊 Basic Pip Value Calculation</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your currency pair, account currency, and position size to calculate the monetary value of each pip movement.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">💰 Profit/Loss Calculation</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your entry and exit prices to calculate potential profit or loss. The calculator will show you the number of pips and the corresponding monetary value.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">⚖️ Risk/Reward Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Add stop loss and take profit levels to analyze your risk/reward ratio. A ratio of 1:2 or higher is generally considered good (risk $1 to potentially gain $2).
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">📝 Example Calculations</h3>
                  <div className="bg-accent/50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium">Example 1: EUR/USD Trade</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Position Size: 1.0 lot</li>
                      <li>Entry: 1.1000</li>
                      <li>Exit: 1.1050</li>
                      <li>Pips: 50</li>
                      <li>Pip Value: $10 per pip</li>
                      <li>Profit: $500</li>
                    </ul>
                  </div>

                  <div className="bg-accent/50 p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium">Example 2: USD/JPY Trade</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Position Size: 0.5 lots</li>
                      <li>Entry: 110.00</li>
                      <li>Exit: 110.50</li>
                      <li>Pips: 50</li>
                      <li>Pip Value: ~$4.54 per pip</li>
                      <li>Profit: ~$227</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Important Notes</p>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Pip values vary based on currency pair and lot size</li>
                        <li>• For JPY pairs, 1 pip = 0.01 (vs 0.0001 for most pairs)</li>
                        <li>• Always use proper risk management in live trading</li>
                        <li>• Consider spreads and commissions in real trades</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
