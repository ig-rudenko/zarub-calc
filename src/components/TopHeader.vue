<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';

defineProps<{
  isDark: boolean;
}>();

const emit = defineEmits<{
  toggleTheme: [];
}>();
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md"
  >
    <div
      class="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8"
    >
      <!-- Zone 1: Single text element wordmark -->
      <a
        href="#calculator"
        class="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
      >
        ZarubCalc
      </a>

      <!-- Zone 2: 4 clean single-line navigation links -->
      <nav
        aria-label="Основная навигация"
        class="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400"
      >
        <a
          href="#calculator"
          class="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Калькулятор
        </a>
        <a
          href="#routes"
          class="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Маршруты перевода
        </a>
        <a
          href="#visual-breakdown"
          class="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
        >
          Диаграмма комиссий
        </a>
      </nav>

      <!-- Zone 3: 1 primary action (Theme toggle) -->
      <div class="flex items-center shrink-0">
        <button
          type="button"
          :aria-label="isDark ? 'Включить светлую тему' : 'Включить тёмную тему'"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          @click="emit('toggleTheme')"
        >
          <Sun v-if="isDark" class="h-4 w-4 text-amber-400" />
          <Moon v-else class="h-4 w-4 text-slate-600" />
          <span>{{ isDark ? 'Светлая тема' : 'Тёмная тема' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
