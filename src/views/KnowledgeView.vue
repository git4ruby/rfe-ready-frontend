<script setup>
import { BookOpenIcon } from '@heroicons/vue/24/outline'
import EmptyState from '../components/EmptyState.vue'
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Knowledge Base</h1>
      <p class="mt-1 text-sm text-gray-500">
        Upload and manage firm-specific templates, sample responses, and regulatory documents.
      </p>
    </div>

    <!-- Empty state -->
    <div class="bg-white shadow rounded-lg p-6">
      <EmptyState
        title="Knowledge Base - Coming in Phase 2"
        description="This feature will allow you to upload and manage firm-specific templates, sample RFE responses, USCIS policy memos, and regulatory documents. The AI will use this knowledge base to generate more accurate and customized draft responses."
        :icon="BookOpenIcon"
      />
    </div>
  </div>
</template>
