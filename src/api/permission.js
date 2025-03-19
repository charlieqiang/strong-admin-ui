import request from '@/utils/request'

export function getRoutes() {
  return request({
    url: '/menu/list',
    method: 'get'
  })
}

export function getRoles() {
  return request({
    url: '/role/list',
    method: 'get'
  })
}

export function addRole(data) {
  return request({
    url: '/role',
    method: 'post',
    data
  })
}

export function updateRole(data) {
  return request({
    url: `/role`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/role/${id}`,
    method: 'delete'
  })
}
