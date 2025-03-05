import request from '@/utils/request'

export function getCaptcha() {
    return request({
        url: '/auth/captcha',
        method: 'get'
    })
}
