"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Bot,
  ListTodo,
  Sparkles,
  Zap,
  Shield,
  Code2,
  Layers,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FEATURES } from "@/lib/features";

const features = [
  {
    icon: ListTodo,
    title: "Task Management",
    description:
      "Organize your tasks with a powerful todo system. Create, update, and track your progress effortlessly.",
  },
  {
    icon: Bot,
    title: "AI Copilot",
    description:
      "Get intelligent assistance with our AI-powered copilot. Ask questions, get suggestions, and boost productivity.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built with Next.js and optimized for performance. Experience instant responses and smooth interactions.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Enterprise-grade security with authentication and authorization built-in from day one.",
  },
  {
    icon: Code2,
    title: "Developer Friendly",
    description:
      "Clean, well-documented code with TypeScript. Easy to extend and customize to your needs.",
  },
  {
    icon: Palette,
    title: "Beautiful UI",
    description:
      "Crafted with shadcn/ui components. Dark mode support and fully responsive design out of the box.",
  },
];

const stats = [
  { value: "10K+", label: "Tasks Completed" },
  { value: "99.9%", label: "Uptime" },
  { value: "500+", label: "Happy Users" },
  { value: "24/7", label: "AI Support" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-1 h-3 w-3" />
              Powered by AI
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Your Productivity
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Supercharged
              </span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              A modern full-stack application with intelligent task management
              and AI-powered assistance. Built with Next.js, TypeScript, and
              beautiful shadcn/ui components.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/todos">
                  <ListTodo className="h-5 w-5" />
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {FEATURES.copilot && (
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href="/copilot">
                    <Bot className="h-5 w-5" />
                    Try Copilot
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="lg" className="gap-2">
                <Link href="/components">
                  <Layers className="h-5 w-5" />
                  View Components
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to be productive
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            From task management to AI assistance, we&apos;ve got you covered with
            a comprehensive suite of tools.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden transition-all hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-24">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Simple, yet powerful
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create Tasks",
                description: "Add your todos with our intuitive interface",
              },
              {
                step: "2",
                title: "Get AI Help",
                description: "Ask the copilot for assistance anytime",
              },
              {
                step: "3",
                title: "Stay Productive",
                description: "Track progress and achieve your goals",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <CardContent className="flex flex-col items-center p-12 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Ready to boost your productivity?
            </h2>
            <p className="mb-8 max-w-xl text-muted-foreground">
              Start organizing your tasks and leverage AI assistance today. No
              credit card required.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/todos">
                  Start Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/components">Explore Components</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {"{{ cookiecutter.project_name }}"}. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="/todos"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Todos
              </Link>
              {FEATURES.copilot && (
                <Link
                  href="/copilot"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Copilot
                </Link>
              )}
              <Link
                href="/components"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Components
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
