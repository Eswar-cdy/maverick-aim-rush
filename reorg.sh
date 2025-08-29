#!/bin/zsh
set -e
PROJECT_ROOT="/Users/eswargeddam/Desktop/THINGS FOR WEBSITE DESIGN"

mkdir -p "$PROJECT_ROOT/frontend/app" "$PROJECT_ROOT/frontend/static-site" \
         "$PROJECT_ROOT/archive/legacy_django_fitness" \
         "$PROJECT_ROOT/archive/backend_fitness_unused" \
         "$PROJECT_ROOT/archive/loose"

if [ -d "$PROJECT_ROOT/Fitness-tracker-main" ]; then
  mv "$PROJECT_ROOT/Fitness-tracker-main/"* "$PROJECT_ROOT/frontend/app/" 2>/dev/null || true
  rm -rf "$PROJECT_ROOT/Fitness-tracker-main"
fi

for item in index.html about.html services.html contact.html questionnaire.html css js img Images; do
  [ -e "$PROJECT_ROOT/$item" ] && mv "$PROJECT_ROOT/$item" "$PROJECT_ROOT/frontend/static-site/"
done

[ -d "$PROJECT_ROOT/fitness" ] && mv "$PROJECT_ROOT/fitness" "$PROJECT_ROOT/archive/legacy_django_fitness"
[ -d "$PROJECT_ROOT/backend/fitness" ] && mv "$PROJECT_ROOT/backend/fitness" "$PROJECT_ROOT/archive/backend_fitness_unused"
[ -d "$PROJECT_ROOT/backend/backend" ] && rmdir "$PROJECT_ROOT/backend/backend" 2>/dev/null || true

[ -f "$PROJECT_ROOT/VISWATEZZ FITNESS Fat-loss Diet Plan Non Vegetarian.png" ] && mv "$PROJECT_ROOT/VISWATEZZ FITNESS Fat-loss Diet Plan Non Vegetarian.png" "$PROJECT_ROOT/archive/loose/"
[ -f "$PROJECT_ROOT/if i want to design a website what are all the terminologies that i need to....html" ] && mv "$PROJECT_ROOT/if i want to design a website what are all the terminologies that i need to....html" "$PROJECT_ROOT/archive/loose/"

echo "Reorganization complete."
