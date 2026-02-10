<script setup>
import { CogIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="mt-1 text-sm text-gray-500">Manage your organization settings.</p>
    </div>

    <!-- Settings card -->
    <div class="bg-white shadow rounded-lg">
      <div class="p-6 space-y-6">
        <!-- Tenant info -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Organization
          </h3>
          <dl class="mt-4 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Tenant Name</dt>
              <dd class="text-sm text-gray-900 sm:col-span-2">My Law Firm</dd>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Plan</dt>
              <dd class="text-sm text-gray-900 sm:col-span-2">Professional</dd>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <dt class="text-sm font-medium text-gray-500">Data Retention</dt>
              <dd class="text-sm text-gray-900 sm:col-span-2">90 days</dd>
            </div>
          </dl>
        </div>

        <!-- Placeholder -->
        <div class="rounded-lg bg-gray-50 border border-gray-200 p-6 text-center">
          <CogIcon class="mx-auto h-10 w-10 text-gray-400" />
          <p class="mt-3 text-sm font-medium text-gray-700">Settings management coming soon</p>
          <p class="mt-1 text-sm text-gray-500">
            Full organization settings including billing, integrations, and data retention policies
            will be available in a future release.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
