<script setup lang="ts">
import { useConfig } from '../main';

const cfg = useConfig();
</script>

<template>
    <div class="q-px-lg plugin-base">
        <div>
            <label>
                <input type="checkbox" v-model="cfg.useInternalAlgorithm" /> Use Internal Algorithm instead of colors
                from Apple
            </label>
        </div>
        <div>
            <label> <input type="checkbox" v-model="cfg.frozen" /> Freeze Colors </label>
        </div>
        <div v-if="!cfg.frozen">
            <label>
                Key Color based on:
                <select class="c-select" v-model="cfg.keyColor">
                    <option value="bgColor">Background Color</option>
                    <option value="textColor1">Text Color 1</option>
                    <option value="textColor2">Text Color 2</option>
                    <option value="textColor3">Text Color 3</option>
                    <option value="textColor4">Text Color 4</option>
                    <option value="cider">Cider Default</option>
                </select>
            </label>
        </div>
        <div v-if="!cfg.frozen">
            <label>
                Music Key Color based on:
                <select class="c-select" v-model="cfg.musicKeyColor">
                    <option value="bgColor">Background Color</option>
                    <option value="textColor1">Text Color 1</option>
                    <option value="textColor2">Text Color 2</option>
                    <option value="textColor3">Text Color 3</option>
                    <option value="textColor4">Text Color 4</option>
                    <option value="cider">Cider Default</option>
                </select>
            </label>
        </div>
    </div>
</template>

<style scoped>
div {
    margin: 10px 0;
}
</style>
