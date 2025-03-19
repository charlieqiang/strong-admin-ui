import request from '@/utils/request'

export function getCaptcha() {
    return request({
        url: '/auth/captcha',
        method: 'get'
    })
}

export function login(data) {
    return request({
        url: '/auth/login',
        method: 'post',
        data
    })
}

export function logout() {
    return request({
        url: '/auth/logout',
        method: 'post'
    })
}
