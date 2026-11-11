<script setup lang="ts">
import type { CryptoAssetId } from '../types/calculator';

withDefaults(
  defineProps<{
    assetId: CryptoAssetId;
    sizeClass?: string;
  }>(),
  {
    sizeClass: 'h-4 w-4',
  },
);
</script>

<template>
  <!-- USDT (Tether TRC-20) -->
  <svg
    v-if="assetId === 'USDT_TRC20'"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="shrink-0"
    :class="sizeClass"
  >
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657Zm0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117Z"
      fill="white"
    />
  </svg>

  <!-- USDT в сети TON (Tether + TON badge) -->
  <svg
    v-else-if="assetId === 'USDT_TON'"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="shrink-0"
    :class="sizeClass"
  >
    <circle cx="15" cy="15" r="14" fill="#26A17B" />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M16.68 16.21v-.002c-.096.007-.592.037-1.699.037-.884 0-1.506-.026-1.725-.037v.003c-3.402-.15-5.941-.742-5.941-1.451 0-.708 2.539-1.3 5.941-1.452v2.313c.222.016.86.054 1.74.054 1.056 0 1.585-.044 1.684-.053v-2.312c3.395.151 5.928.744 5.928 1.45 0 .71-2.533 1.3-5.928 1.45Zm0-3.141v-2.07h4.737V7.842H8.52v3.157h4.737v2.07c-3.85.176-6.745.94-6.745 1.853 0 .913 2.895 1.675 6.745 1.853v6.634h3.424v-6.636c3.844-.177 6.732-.939 6.732-1.851 0-.913-2.888-1.675-6.732-1.853Z"
      fill="white"
    />
    <circle cx="24.5" cy="24.5" r="7" fill="#0098EA" stroke="white" stroke-width="1.5" />
    <path
      d="M22.2 22.1h4.6c.65 0 1.06.7.74 1.27l-2.65 4.63a.45.45 0 0 1-.78 0l-2.65-4.63c-.32-.57.09-1.27.74-1.27Z"
      fill="white"
    />
  </svg>

  <!-- TRX (TRON Official Geometric Polygon SVG Emblem) -->
  <svg
    v-else-if="assetId === 'TRX'"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="shrink-0"
    :class="sizeClass"
  >
    <circle cx="16" cy="16" r="16" fill="#EF0027" />
    <path
      d="M21.932 9.913 7.5 7.257l7.595 19.112 10.583-12.894-3.746-3.562Zm-.232 1.17 2.208 2.099-6.038 1.096 3.83-3.195Zm-5.142 2.973-6.364-5.278 10.402 1.918-4.038 3.36Zm-.453.934-1.038 8.58-5.472-13.86 6.51 5.28Zm.96.455 6.687-1.21-7.67 9.343.983-8.133Z"
      fill="white"
    />
  </svg>

  <!-- GRAM (TON Ecosystem Crystal / Diamond Emblem) -->
  <svg
    v-else
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    class="shrink-0"
    :class="sizeClass"
  >
    <circle cx="16" cy="16" r="16" fill="#0088CC" />
    <path
      d="M11.127 9.6h9.746c1.387 0 2.257 1.498 1.568 2.705l-5.622 9.839a.945.945 0 0 1-1.638 0L9.559 12.305C8.87 11.098 9.74 9.6 11.127 9.6Zm.747 1.92 3.246 5.685V11.52h-3.246Zm5.006 5.685 3.246-5.685H16.88v5.685Z"
      fill="white"
    />
  </svg>
</template>
