/**
 * Define qué roles pueden comunicarse con qué otros roles.
 * Matriz de permisos de comunicación del sistema.
 */

const Role = {
  BODEGUERO: 'BODEGUERO',
  TEAM_LEADER: 'TEAM_LEADER',
  SUPERVISOR: 'SUPERVISOR',
  IT: 'IT',
  ADMIN: 'ADMIN',
};

/**
 * Mapa de comunicación permitida por rol.
 * IT y ADMIN pueden comunicarse con todos.
 * Todos pueden comunicarse con IT.
 */
const COMMUNICATION_MATRIX = {
  [Role.BODEGUERO]: [Role.TEAM_LEADER, Role.IT, Role.ADMIN],
  [Role.TEAM_LEADER]: [Role.BODEGUERO, Role.TEAM_LEADER, Role.SUPERVISOR, Role.IT, Role.ADMIN],
  [Role.SUPERVISOR]: [Role.BODEGUERO, Role.TEAM_LEADER, Role.SUPERVISOR, Role.IT, Role.ADMIN],
  [Role.IT]: [Role.BODEGUERO, Role.TEAM_LEADER, Role.SUPERVISOR, Role.IT, Role.ADMIN],
  [Role.ADMIN]: [Role.BODEGUERO, Role.TEAM_LEADER, Role.SUPERVISOR, Role.IT, Role.ADMIN],
};

/**
 * Verifica si un usuario puede iniciar una conversación directa con otro usuario.
 * @param {string} senderRole - Rol del usuario que envía
 * @param {string} receiverRole - Rol del usuario destino
 * @returns {boolean}
 */
const canCommunicateWith = (senderRole, receiverRole) => {
  const allowed = COMMUNICATION_MATRIX[senderRole];
  if (!allowed) return false;
  return allowed.includes(receiverRole);
};

/**
 * Verifica si un bodeguero puede hablar con un usuario específico.
 * Los bodegueros solo pueden hablar con su propio líder (mismo team) o IT.
 * @param {object} sender - Usuario que envía (con teamId y role)
 * @param {object} receiver - Usuario destino (con teamId y role)
 * @returns {boolean}
 */
const canBodegueroTalkTo = (sender, receiver) => {
  if (receiver.role === Role.IT || receiver.role === Role.ADMIN) return true;
  if (receiver.role === Role.TEAM_LEADER) {
    // Solo puede hablar con su propio líder (mismo equipo)
    return sender.teamId && receiver.teamId === null 
      ? false 
      : sender.teamId === receiver.id || receiver.ledTeamId === sender.teamId;
  }
  return false;
};

/**
 * Verifica si un usuario puede participar en un grupo basado en las reglas de negocio.
 * @param {string} userRole
 * @param {string[]} participantRoles - Roles de los demás participantes
 * @returns {boolean}
 */
const canJoinGroupWithRoles = (userRole, participantRoles) => {
  return participantRoles.every(role => canCommunicateWith(userRole, role));
};

/**
 * Roles que tienen acceso al panel de administración
 */
const ADMIN_ROLES = [Role.SUPERVISOR, Role.IT, Role.ADMIN];

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

/**
 * Roles que pueden crear grupos
 */
const CAN_CREATE_GROUPS = [Role.TEAM_LEADER, Role.SUPERVISOR, Role.IT, Role.ADMIN];

const canCreateGroup = (role) => CAN_CREATE_GROUPS.includes(role);

module.exports = {
  Role,
  COMMUNICATION_MATRIX,
  canCommunicateWith,
  canBodegueroTalkTo,
  canJoinGroupWithRoles,
  isAdminRole,
  canCreateGroup,
};
