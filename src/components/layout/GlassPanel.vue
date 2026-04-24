<template>
  <div class="glass-blob-panel">
    <svg
      aria-hidden="true"
      class="gradient-blob"
      viewBox="-120 -120 240 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="blobGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          class="gradient-element"
        >
          <stop offset="40%" style="stop-color: var(--gradient-breath-start); stop-opacity: 1" />
          <stop offset="100%" style="stop-color: var(--gradient-breath-end); stop-opacity: 1" />
        </linearGradient>
      </defs>

      <path
        class="blob-path"
        d="M 74.27332230365087,0 C 74.83693175213968,30.599222038082097 65.27071194691645,45.41079158492555 36.46015705833725,63.15084447698112 C 7.649602169758058,80.8908973690367 -10.577819325757552,86.74792268746755 -40.968897250665904,70.96021156822228 C -71.35997517557425,55.172500448977 -85.22055812868366,35.27848902977774 -85.10415464129615,1.042225305756047e-14 C -84.98775115390863,-35.278489029777724 -70.3307517775354,-55.34223363205183 -40.50328330111585,-70.15374455088865 C -10.67581482469631,-84.96525546972546 5.511567863190329,-76.78447981306942 34.20571926438201,-59.246043675347266 C 62.899870665573694,-41.70760753762511 73.70971285516207,-30.599222038082097 74.27332230365087,0 Z"
      />
    </svg>

    <div class="glass-panel">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.glass-blob-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 1.2rem;
  isolation: isolate;
}

.gradient-blob {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  fill: url(#blobGradient);
  opacity: 0.2;
  filter: blur(50px);
  transform: scale(1.7);
  max-width: 400px;
  overflow: hidden;
}

.glass-panel {
  position: relative;
  box-sizing: border-box;
  z-index: 1;
  min-width: 550px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.2rem;
  box-shadow: var(--shadow-panel);
}

@media screen and (max-width: 720px) {
  .glass-panel {
    min-width: 200px;
  }

  .gradient-blob {
    max-width: 300px;
  }
}

@media screen and (max-width: 490px) {
  .gradient-blob {
    max-width: 200px;
  }
}
</style>
