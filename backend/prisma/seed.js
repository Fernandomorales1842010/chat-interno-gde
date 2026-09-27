const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // ── 1. Crear Usuarios ──────────────────────────────────────────────────────

  const password = await bcrypt.hash('Password123!', 12);

  // ADMIN
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Administrador Sistema',
      password,
      role: 'ADMIN',
    }
  });

  // SUPERVISORES
  const supervisor1 = await prisma.user.upsert({
    where: { username: 'sup.garcia' },
    update: {},
    create: {
      username: 'sup.garcia',
      fullName: 'Carlos García',
      password,
      role: 'SUPERVISOR',
    }
  });

  const supervisor2 = await prisma.user.upsert({
    where: { username: 'sup.martinez' },
    update: {},
    create: {
      username: 'sup.martinez',
      fullName: 'Ana Martínez',
      password,
      role: 'SUPERVISOR',
    }
  });

  // IT
  const it1 = await prisma.user.upsert({
    where: { username: 'it.lopez' },
    update: {},
    create: {
      username: 'it.lopez',
      fullName: 'Roberto López',
      password,
      role: 'IT',
    }
  });

  const it2 = await prisma.user.upsert({
    where: { username: 'it.flores' },
    update: {},
    create: {
      username: 'it.flores',
      fullName: 'María Flores',
      password,
      role: 'IT',
    }
  });

  // LÍDERES DE EQUIPO
  const leader1 = await prisma.user.upsert({
    where: { username: 'lider.perez' },
    update: {},
    create: {
      username: 'lider.perez',
      fullName: 'Jorge Pérez',
      password,
      role: 'TEAM_LEADER',
    }
  });

  const leader2 = await prisma.user.upsert({
    where: { username: 'lider.ramirez' },
    update: {},
    create: {
      username: 'lider.ramirez',
      fullName: 'Sandra Ramírez',
      password,
      role: 'TEAM_LEADER',
    }
  });

  const leader3 = await prisma.user.upsert({
    where: { username: 'lider.torres' },
    update: {},
    create: {
      username: 'lider.torres',
      fullName: 'Miguel Torres',
      password,
      role: 'TEAM_LEADER',
    }
  });

  // BODEGUEROS - Equipo A
  const bodegueroA1 = await prisma.user.upsert({
    where: { username: 'bod.hernandez' },
    update: {},
    create: {
      username: 'bod.hernandez',
      fullName: 'Luis Hernández',
      password,
      role: 'BODEGUERO',
    }
  });

  const bodegueroA2 = await prisma.user.upsert({
    where: { username: 'bod.morales' },
    update: {},
    create: {
      username: 'bod.morales',
      fullName: 'Pedro Morales',
      password,
      role: 'BODEGUERO',
    }
  });

  const bodegueroA3 = await prisma.user.upsert({
    where: { username: 'bod.jimenez' },
    update: {},
    create: {
      username: 'bod.jimenez',
      fullName: 'Elena Jiménez',
      password,
      role: 'BODEGUERO',
    }
  });

  // BODEGUEROS - Equipo B
  const bodegueroB1 = await prisma.user.upsert({
    where: { username: 'bod.vargas' },
    update: {},
    create: {
      username: 'bod.vargas',
      fullName: 'Carmen Vargas',
      password,
      role: 'BODEGUERO',
    }
  });

  const bodegueroB2 = await prisma.user.upsert({
    where: { username: 'bod.castillo' },
    update: {},
    create: {
      username: 'bod.castillo',
      fullName: 'David Castillo',
      password,
      role: 'BODEGUERO',
    }
  });

  // BODEGUEROS - Equipo C
  const bodegueroC1 = await prisma.user.upsert({
    where: { username: 'bod.reyes' },
    update: {},
    create: {
      username: 'bod.reyes',
      fullName: 'Fernando Reyes',
      password,
      role: 'BODEGUERO',
    }
  });

  console.log('✅ Usuarios creados');

  // ── 2. Crear Equipos ───────────────────────────────────────────────────────

  // Equipo A - Recepción
  const teamA = await prisma.team.upsert({
    where: { leaderId: leader1.id },
    update: {},
    create: {
      name: 'Equipo A - Recepción',
      leaderId: leader1.id,
    }
  });

  // Equipo B - Almacén
  const teamB = await prisma.team.upsert({
    where: { leaderId: leader2.id },
    update: {},
    create: {
      name: 'Equipo B - Almacén',
      leaderId: leader2.id,
    }
  });

  // Equipo C - Despacho
  const teamC = await prisma.team.upsert({
    where: { leaderId: leader3.id },
    update: {},
    create: {
      name: 'Equipo C - Despacho',
      leaderId: leader3.id,
    }
  });

  // Asignar teamId a los líderes y bodegueros
  await prisma.user.update({ where: { id: leader1.id }, data: { teamId: teamA.id } });
  await prisma.user.update({ where: { id: leader2.id }, data: { teamId: teamB.id } });
  await prisma.user.update({ where: { id: leader3.id }, data: { teamId: teamC.id } });

  await prisma.user.updateMany({
    where: { id: { in: [bodegueroA1.id, bodegueroA2.id, bodegueroA3.id] } },
    data: { teamId: teamA.id }
  });

  await prisma.user.updateMany({
    where: { id: { in: [bodegueroB1.id, bodegueroB2.id] } },
    data: { teamId: teamB.id }
  });

  await prisma.user.update({ where: { id: bodegueroC1.id }, data: { teamId: teamC.id } });

  console.log('✅ Equipos creados');

  // ── 3. Crear Grupos del Sistema ────────────────────────────────────────────

  // Grupo General - TODOS
  const allUserIds = [
    admin.id, supervisor1.id, supervisor2.id, it1.id, it2.id,
    leader1.id, leader2.id, leader3.id,
    bodegueroA1.id, bodegueroA2.id, bodegueroA3.id,
    bodegueroB1.id, bodegueroB2.id, bodegueroC1.id
  ];

  await createSystemGroup(
    '📢 General',
    'Comunicación general del centro de distribución',
    allUserIds,
    admin.id
  );

  // Grupo de Supervisores
  await createSystemGroup(
    '👔 Supervisores',
    'Canal privado de supervisores',
    [admin.id, supervisor1.id, supervisor2.id],
    admin.id
  );

  // Grupo de Líderes
  await createSystemGroup(
    '🎯 Líderes de Equipo',
    'Canal de coordinación de líderes',
    [admin.id, supervisor1.id, supervisor2.id, leader1.id, leader2.id, leader3.id],
    admin.id
  );

  // Grupo de IT
  await createSystemGroup(
    '💻 IT',
    'Canal del equipo de IT',
    [admin.id, it1.id, it2.id],
    admin.id
  );

  // Grupos de Equipos
  await createSystemGroup(
    '📦 Equipo A - Recepción',
    'Grupo del equipo de recepción',
    [leader1.id, bodegueroA1.id, bodegueroA2.id, bodegueroA3.id],
    leader1.id
  );

  await createSystemGroup(
    '🏪 Equipo B - Almacén',
    'Grupo del equipo de almacén',
    [leader2.id, bodegueroB1.id, bodegueroB2.id],
    leader2.id
  );

  await createSystemGroup(
    '🚚 Equipo C - Despacho',
    'Grupo del equipo de despacho',
    [leader3.id, bodegueroC1.id],
    leader3.id
  );

  // Mensaje de bienvenida en el grupo General
  const generalGroup = await prisma.conversation.findFirst({
    where: { name: '📢 General', isSystem: true }
  });

  if (generalGroup) {
    await prisma.message.create({
      data: {
        conversationId: generalGroup.id,
        senderId: admin.id,
        content: '¡Bienvenidos al Chat Interno del Centro de Distribución! 🏭\n\nEste es el canal de comunicación oficial. Por favor úsenlo con responsabilidad.',
        type: 'SYSTEM',
      }
    });
  }

  console.log('✅ Grupos del sistema creados');
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba (password: Password123!):');
  console.log('  Admin:      admin');
  console.log('  Supervisor: sup.garcia');
  console.log('  IT:         it.lopez');
  console.log('  Líder:      lider.perez');
  console.log('  Bodeguero:  bod.hernandez');
}

async function createSystemGroup(name, description, participantIds, adminId) {
  // Evitar duplicados
  const existing = await prisma.conversation.findFirst({
    where: { name, isSystem: true }
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: 'GROUP',
      name,
      description,
      isSystem: true,
      participants: {
        create: participantIds.map(uid => ({
          userId: uid,
          role: uid === adminId ? 'ADMIN' : 'MEMBER'
        }))
      }
    }
  });
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
