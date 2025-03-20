<template>
  <div class="dashboard-container">
    <div class="dashboard-text">{{ greeting }} {{ username }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Dashboard',
  computed: {
    ...mapGetters([
      'username'
    ]),
    greeting() {
      const hour = new Date().getHours()
      if (hour >= 6 && hour < 12) {
        return '早上好！'
      } else if (hour >= 12 && hour < 18) {
        return '下午好！'
      } else {
        return '晚上好！'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 30px;
  }

  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}
</style>
